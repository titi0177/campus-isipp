import { assertStaffFromAccessToken, passwordFromDni, getServiceSupabase } from '@/server/supabase-service'

interface ProvisionRequest {
  accessToken: string
  email: string
  dni: string
  name: string
  department: string
}

interface ProvisionResponse {
  ok: boolean
  message: string
}

export async function provisionProfessorWithAuth(req: {
  data: ProvisionRequest
}): Promise<ProvisionResponse> {
  try {
    const { accessToken, email, dni, name, department } = req.data

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

    return {
      ok: true,
      message: 'Profesor creado exitosamente.',
    }
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : 'Error desconocido',
    }
  }
}
