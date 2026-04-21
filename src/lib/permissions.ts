import { supabase } from '@/lib/supabase'

export type UserRole = 'admin' | 'professor' | 'student'

export async function getUserRole(): Promise<UserRole | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    // Intentar obtener como admin
    const { data: admin } = await supabase
      .from('admin_users')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (admin) return 'admin'

    // Intentar obtener como profesor
    const { data: professor } = await supabase
      .from('professors')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (professor) return 'professor'

    // Si no es admin ni profesor, es estudiante
    return 'student'
  } catch (err) {
    console.error('Error getting user role:', err)
    return null
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
