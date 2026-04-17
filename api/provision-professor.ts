import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

function getServiceSupabase() {
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    throw new Error('Faltan SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en el servidor')
  }

  return createClient<Database>(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

async function assertStaffFromAccessToken(accessToken: string | undefined) {
  if (!accessToken?.trim()) {
    throw new Error('No autenticado.')
  }
  const admin = getServiceSupabase()
  const { data: authData, error: authErr } = await admin.auth.getUser(accessToken)
  if (authErr || !authData.user) {
    throw new Error('Sesión inválida o expirada.')
  }
  const { data: profile, error: pErr } = await admin
    .from('profiles')
    .select('role')
    .eq('id', authData.user.id)
    .single()
  if (pErr || !profile) {
    throw new Error('No se encontró el perfil del operador.')
  }
  const r = profile.role
  if (r !== 'admin' && r !== 'operador') {
    throw new Error('No tenés permisos para crear usuarios.')
  }
  return authData.user
}

function passwordFromDni(dni: string): string {
  const digits = dni.replace(/\D/g, '')
  if (digits.length < 6) {
    throw new Error(
      'El DNI debe tener al menos 6 dígitos para usarlo como contraseña inicial (requisito de seguridad).',
    )
  }
  return digits
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' })
  }

  try {
    const { accessToken, email, dni, name, department } = req.body

    console.log('Datos recibidos:', { accessToken: !!accessToken, email, dni, name, department })

    if (!accessToken?.trim()) {
      return res.status(400).json({ error: 'accessToken requerido' })
    }
    if (!email?.trim()) {
      return res.status(400).json({ error: 'email requerido' })
    }
    if (!dni?.trim()) {
      return res.status(400).json({ error: 'dni requerido' })
    }
    if (!name?.trim()) {
      return res.status(400).json({ error: 'name requerido' })
    }
    if (!department?.trim()) {
      return res.status(400).json({ error: 'department requerido' })
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

    if (authError || !authData.user) {
      throw new Error(`Error creando usuario en Auth: ${authError?.message || 'Desconocido'}`)
    }

    // 2. Crear registro en tabla professors con user_id
    const { error: profError } = await admin.from('professors').insert({
      user_id: authData.user.id,
      email,
      name,
      department,
    })

    if (profError) {
      // Limpiar usuario Auth si falla la creación del profesor
      await admin.auth.admin.deleteUser(authData.user.id)
      throw new Error(`Error creando profesor: ${profError.message}`)
    }

    // 3. Crear perfil con rol docente
    const { error: profileError } = await admin.from('profiles').insert({
      id: authData.user.id,
      role: 'profesor',
      full_name: name,
    })

    if (profileError) {
      // Limpiar si falla
      await admin.auth.admin.deleteUser(authData.user.id)
      await admin.from('professors').delete().eq('user_id', authData.user.id)
      throw new Error(`Error creando perfil: ${profileError.message}`)
    }

    return res.status(200).json({
      ok: true,
      message: 'Profesor creado exitosamente.',
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error desconocido'
    console.error('Error en provision-professor:', message)
    return res.status(400).json({
      ok: false,
      message,
    })
  }
}
