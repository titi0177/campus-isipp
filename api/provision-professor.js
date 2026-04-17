import { createClient } from '@supabase/supabase-js'

function getServiceSupabase() {
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    throw new Error('Faltan variables de entorno: SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY')
  }

  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

async function assertStaffFromAccessToken(accessToken) {
  if (!accessToken?.trim()) {
    throw new Error('Token de acceso vacío')
  }

  const admin = getServiceSupabase()

  const { data: authData, error: authErr } = await admin.auth.getUser(accessToken)
  if (authErr || !authData?.user) {
    throw new Error('Sesión inválida o expirada')
  }

  const { data: profile, error: pErr } = await admin
    .from('profiles')
    .select('role')
    .eq('id', authData.user.id)
    .single()

  if (pErr) {
    throw new Error('No se encontró el perfil del operador')
  }

  if (!profile) {
    throw new Error('Perfil sin datos')
  }

  const r = profile.role
  if (r !== 'admin' && r !== 'operador') {
    throw new Error('Permisos insuficientes')
  }

  return authData.user
}

function passwordFromDni(dni) {
  const digits = dni.replace(/\D/g, '')
  if (digits.length < 6) {
    throw new Error('DNI debe tener al menos 6 dígitos')
  }
  return digits
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', 'true')
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT')
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version')

  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, message: 'Método no permitido' })
  }

  try {
    const { accessToken, email, dni, name, department } = req.body

    if (!accessToken?.trim()) {
      return res.status(400).json({ ok: false, message: 'accessToken requerido' })
    }
    if (!email?.trim()) {
      return res.status(400).json({ ok: false, message: 'email requerido' })
    }
    if (!dni?.trim()) {
      return res.status(400).json({ ok: false, message: 'dni requerido' })
    }
    if (!name?.trim()) {
      return res.status(400).json({ ok: false, message: 'name requerido' })
    }
    if (!department?.trim()) {
      return res.status(400).json({ ok: false, message: 'department requerido' })
    }

    // Validar staff
    await assertStaffFromAccessToken(accessToken)

    // Generar contraseña desde DNI
    const password = passwordFromDni(dni)

    const admin = getServiceSupabase()

    // 1. Crear usuario en Supabase Auth
    const { data: authData, error: authError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })

    if (authError) {
      throw new Error(`Auth: ${authError.message}`)
    }

    if (!authData?.user?.id) {
      throw new Error('No se obtuvo ID del usuario creado')
    }

    const userId = authData.user.id

    // 2. Crear registro en tabla professors
    const { error: profError } = await admin.from('professors').insert({
      user_id: userId,
      email,
      name,
      department,
    })

    if (profError) {
      // Limpiar usuario Auth
      await admin.auth.admin.deleteUser(userId).catch(() => {})
      throw new Error(`Profesor: ${profError.message}`)
    }

    // 3. Crear perfil con rol docente
    const { error: profileError } = await admin.from('profiles').insert({
      id: userId,
      role: 'profesor',
      full_name: name,
    })

    if (profileError) {
      // Limpiar si falla
      await admin.auth.admin.deleteUser(userId).catch(() => {})
      await admin.from('professors').delete().eq('user_id', userId).catch(() => {})
      throw new Error(`Perfil: ${profileError.message}`)
    }

    return res.status(200).json({
      ok: true,
      message: 'Profesor creado exitosamente',
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error desconocido'
    return res.status(400).json({
      ok: false,
      message,
    })
  }
}
