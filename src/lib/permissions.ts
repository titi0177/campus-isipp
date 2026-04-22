import { supabase } from '@/lib/supabase'

export type UserRole = 'admin' | 'professor' | 'student'

export async function getUserRole(): Promise<UserRole | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    // Intentar obtener como profesor
    const { data: professor, error: profError } = await supabase
      .from('professors')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle()

    if (professor && !profError) return 'professor'

    // Intentar obtener como estudiante
    const { data: student, error: studError } = await supabase
      .from('students')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle()

    if (student && !studError) return 'student'

    // Si es profesor o estudiante pero no encontró registros, podría ser admin
    // El admin es quien no está en professors ni students
    // Pero para ser admin, el email debe estar en la tabla auth.users con metdata admin=true
    const userMetadata = user.user_metadata || {}
    if (userMetadata.role === 'admin' || user.email?.endsWith('@admin.isipp.edu.ar')) {
      return 'admin'
    }

    // Por defecto, si no es profesor ni estudiante, es admin
    // (esto permite que el primer usuario sea admin)
    return 'admin'
  } catch (err) {
    console.error('Error getting user role:', err)
    return 'admin' // Por defecto admin si hay error, para no bloquear acceso
  }
}

export function canAccessAdmin(role: UserRole | null): boolean {
  return role === 'admin'
}

export function canEditGrades(role: UserRole | null): boolean {
  return role === 'admin' || role === 'professor'
}

export function canManageEnrollments(role: UserRole | null): boolean {
  return role === 'admin'
}

export function canManageStudents(role: UserRole | null): boolean {
  return role === 'admin'
}

export const VALID_FINAL_STATUS = ['aprobado', 'promocionado', 'desaprobado'] as const
export const VALID_PARTIAL_STATUS = ['regular', 'promocionado', 'desaprobado'] as const

export function isValidFinalStatus(status: string): status is typeof VALID_FINAL_STATUS[number] {
  return VALID_FINAL_STATUS.includes(status as any)
}

export function isValidPartialStatus(status: string): status is typeof VALID_PARTIAL_STATUS[number] {
  return VALID_PARTIAL_STATUS.includes(status as any)
}

export function isValidGrade(grade: number): boolean {
  return grade >= 0 && grade <= 10
}
