import { supabase } from '@/lib/supabase'

export type AuditAction = 'UPDATE_GRADE' | 'CREATE_GRADE' | 'DELETE_ENROLLMENT' | 'CREATE_ENROLLMENT' | 'EDIT_STUDENT'

export async function logAudit(
  action: AuditAction,
  adminId: string,
  targetType: string,
  targetId: string,
  oldValue: any,
  newValue: any,
  details?: string
) {
  try {
    // Intentar guardar en tabla audit_logs si existe
    const { error } = await supabase
      .from('audit_logs')
      .insert({
        action,
        admin_id: adminId,
        target_type: targetType,
        target_id: targetId,
        old_value: JSON.stringify(oldValue),
        new_value: JSON.stringify(newValue),
        details,
        created_at: new Date().toISOString(),
      })

    if (error) {
      // Si la tabla no existe, registrar en consola
      console.log(`[AUDIT] ${action} | ${targetType}:${targetId} | ${details}`)
      console.log(`[OLD]`, oldValue)
      console.log(`[NEW]`, newValue)
    }
  } catch (err) {
    // Si hay error, simplemente loguear en consola
    console.log(`[AUDIT-FALLBACK] ${action} | ${targetType}:${targetId} | ${details}`)
  }
}

export async function getAuditLogs(
  targetType?: string,
  targetId?: string,
  action?: string,
  days: number = 30
) {
  try {
    const fromDate = new Date()
    fromDate.setDate(fromDate.getDate() - days)

    let query = supabase
      .from('audit_logs')
      .select('*')
      .gte('created_at', fromDate.toISOString())
      .order('created_at', { ascending: false })

    if (targetType) {
      query = query.eq('target_type', targetType)
    }

    if (targetId) {
      query = query.eq('target_id', targetId)
    }

    if (action) {
      query = query.eq('action', action)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching audit logs:', error)
      return []
    }

    return data || []
  } catch (err) {
    console.error('Error in getAuditLogs:', err)
    return []
  }
}
