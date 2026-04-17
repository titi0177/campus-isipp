const { createClient } = require('@supabase/supabase-js')

function getServiceSupabase() {
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    throw new Error('Faltan SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en el servidor')
  }

  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

async function assertStaffFromAccessToken(accessToken) {
  if (!accessToken?.trim()) {
    throw new Error('No autenticado.')
  }
  const admin = getServiceSupabase()
  
  try {
    const { data: authData, error: authErr } = await admin.auth.getUser(accessToken)
    if (authErr || !authData.user) {
      console.error('Auth error:', authErr)
      throw new Error('Sesión inválida o expirada.')
    }

    const { data: profile, error: pErr } = await admin
      .from('profiles')
      .select('role')
      .eq('id', authData.user.id)
      .single()

    if (pErr) {
      console.error('Profile error:', pErr)
      throw new Error(`No se encontró el perfil del operador: ${pErr.message}`)
    }

    if (!profile) {
      throw new Error('Perfil vacío')
    }

    const r = profile.role
    if (r !== 'admin' && r !== 'operador') {
      throw new Error(`Rol insuficiente: ${r}. Se requiere admin u operador.`)
    }

    return authData.user
  } catch (error) {
    console.error('assertStaffFromAccessToken error:', error)
    throw error
  }
}

function passwordFromDni(dni) {
  const digits = dni.replace(/\D/g, '')
  if (digits.length < 6) {
    throw new Error(
      'El DNI debe tener al menos 6 dígitos para usarlo como contraseña inicial (requisito de seguridad).',
    )
  }
  return digits
}

module.exports = async function handler(req, res) {
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

    console.log('=== PROVISION PROFESSOR REQUEST ===')
    console.log('Datos recibidos:', { 
      accessToken: accessToken ? 'present' : 'missing', 
      email, 
      dni, 
      name, 
      department 
    })

    // Validar campos requeridos
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

    console.log('Paso 1: Validando staff...')
    await assertStaffFromAccessToken(accessToken)
    console.log('Paso 1 OK: Staff validado')

    console.log('Paso 2: Generando contraseña...')
    const password = passwordFromDni(dni)
    console.log('Paso 2 OK: Contraseña generada')

    console.log('Paso 3: Creando cliente Supabase...')
    const admin = getServiceSupabase()
    console.log('Paso 3 OK: Cliente creado')

    console.log('Paso 4: Creando usuario en Auth...')
    const { data: authData, error: authError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })

    if (authError || !authData.user) {
      console.error('Paso 4 ERROR:', authError)
      throw new Error(`Error creando usuario en Auth: ${authError?.message || 'Desconocido'}`)
    }
    console.log('Paso 4 OK: Usuario creado en Auth:', authData.user.id)

    console.log('Paso 5: Creando registro en professors...')
    const { error: profError } = await admin.from('professors').insert({
      user_id: authData.user.id,
      email,
      name,
      department,
    })

    if (profError) {
      console.error('Paso 5 ERROR:', profError)
      await admin.auth.admin.deleteUser(authData.user.id)
      throw new Error(`Error creando profesor: ${profError.message}`)
    }
    console.log('Paso 5 OK: Profesor creado')

    console.log('Paso 6: Creando perfil...')
    const { error: profileError } = await admin.from('profiles').insert({
      id: authData.user.id,
      role: 'profesor',
      full_name: name,
    })

    if (profileError) {
      console.error('Paso 6 ERROR:', profileError)
      await admin.auth.admin.deleteUser(authData.user.id)
      await admin.from('professors').delete().eq('user_id', authData.user.id)
      throw new Error(`Error creando perfil: ${profileError.message}`)
    }
    console.log('Paso 6 OK: Perfil creado')

    console.log('=== PROVISION PROFESSOR SUCCESS ===')
    return res.status(200).json({
      ok: true,
      message: 'Profesor creado exitosamente.',
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error desconocido'
    console.error('=== PROVISION PROFESSOR ERROR ===', message)
    return res.status(400).json({
      ok: false,
      message,
    })
  }
}
