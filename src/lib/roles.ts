/** Roles almacenados en `profiles.role` (esquema Guaraní / ISIPP). */
export type DbRole = 'admin' | 'profesor' | 'alumno' | 'operador' | 'treasurer'

/** Compatibilidad con datos antiguos en inglés (migración manual). */
const LEGACY: Record<string, DbRole | undefined> = {
  student: 'alumno',
  professor: 'profesor',
  admin: 'admin',
  operator: 'operador',
}

export function normalizeDbRole(role: string | undefined): DbRole | undefined {
  if (!role) return undefined
  if (role === 'admin' || role === 'profesor' || role === 'alumno' || role === 'operador' || role === 'treasurer') return role as DbRole
  return LEGACY[role]
}

export function homePathForRole(role: string | undefined): '/admin' | '/professor' | '/dashboard' | '/treasurer' {
  const r = normalizeDbRole(role)
  if (r === 'admin' || r === 'operador') return '/admin'
  if (r === 'profesor') return '/professor'
  if (r === 'treasurer') return '/treasurer'
  return '/dashboard'
}

export function isStaffRole(role: string | undefined): boolean {
  const r = normalizeDbRole(role)
  return r === 'admin' || r === 'operador' || r === 'treasurer' || r === 'profesor'
}
