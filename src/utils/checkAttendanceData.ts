/**
 * Utilidad para verificar los datos de asistencia en la BD
 * Úsalo en la consola del navegador para debuggear
 */

import { supabase } from '@/lib/supabase'

/**
 * Verifica todos los registros de asistencia para una materia
 */
export async function checkAttendanceBySubject(subjectId: string) {
  try {
    console.log('🔍 Verificando asistencia para materia:', subjectId)

    // 1. Obtener todas las inscripciones de la materia
    const { data: enrollments, error: enrollError } = await supabase
      .from('enrollments')
      .select('id, student_id, student:students(first_name, last_name)')
      .eq('subject_id', subjectId)

    if (enrollError) {
      console.error('❌ Error obteniendo inscripciones:', enrollError)
      return
    }

    console.log(`✅ Encontradas ${enrollments?.length ?? 0} inscripciones`)

    // 2. Para cada inscripción, verificar tablas
    for (const enr of enrollments || []) {
      const studentName = `${enr.student?.last_name}, ${enr.student?.first_name}`
      console.log(`\n📋 Alumno: ${studentName} (ID: ${enr.id})`)

      // Verificar tabla attendance
      const { data: attendanceRecord } = await supabase
        .from('attendance')
        .select('id, percentage, created_at, updated_at')
        .eq('enrollment_id', enr.id)
        .maybeSingle()

      if (attendanceRecord) {
        console.log(`  ✅ attendance: ${attendanceRecord.percentage}% (ID: ${attendanceRecord.id})`)
        console.log(`     Creado: ${new Date(attendanceRecord.created_at).toLocaleString('es-AR')}`)
      } else {
        console.log('  ⚠️  attendance: sin registro')
      }

      // Verificar tabla class_attendance
      const { data: classAttendance, error: classError } = await supabase
        .from('class_attendance')
        .select('date, present')
        .eq('enrollment_id', enr.id)
        .order('date', { ascending: true })

      if (classError) {
        console.log(`  ❌ class_attendance: Error - ${classError.message}`)
      } else if (classAttendance && classAttendance.length > 0) {
        const presentCount = classAttendance.filter(c => c.present).length
        console.log(`  ✅ class_attendance: ${presentCount}/${classAttendance.length} presentes`)
        console.log(`     Fechas: ${classAttendance.map(c => c.date).join(', ')}`)
      } else {
        console.log('  ⚠️  class_attendance: sin registros')
      }
    }

    console.log('\n✅ Verificación completada')
  } catch (err) {
    console.error('❌ Error en verificación:', err)
  }
}

/**
 * Verifica un alumno específico
 */
export async function checkStudentAttendance(enrollmentId: string) {
  try {
    console.log('🔍 Verificando asistencia para inscripción:', enrollmentId)

    // Verificar attendance
    const { data: attendance } = await supabase
      .from('attendance')
      .select('*')
      .eq('enrollment_id', enrollmentId)
      .maybeSingle()

    console.log('📊 attendance:', attendance)

    // Verificar class_attendance
    const { data: classAttendance } = await supabase
      .from('class_attendance')
      .select('*')
      .eq('enrollment_id', enrollmentId)
      .order('date')

    console.log(`📅 class_attendance (${classAttendance?.length ?? 0} registros):`)
    classAttendance?.forEach(ca => {
      console.log(`   ${ca.date}: ${ca.present ? '✓ Presente' : '✗ Ausente'}`)
    })
  } catch (err) {
    console.error('❌ Error:', err)
  }
}

/**
 * Limpia registros de asistencia para testing (¡usa con cuidado!)
 */
export async function clearAttendanceData(enrollmentId: string) {
  try {
    console.warn('⚠️  Eliminando datos de asistencia para:', enrollmentId)

    const { error: e1 } = await supabase
      .from('attendance')
      .delete()
      .eq('enrollment_id', enrollmentId)

    const { error: e2 } = await supabase
      .from('class_attendance')
      .delete()
      .eq('enrollment_id', enrollmentId)

    if (e1 || e2) {
      console.error('❌ Error deletando:', e1 || e2)
    } else {
      console.log('✅ Datos de asistencia eliminados')
    }
  } catch (err) {
    console.error('❌ Error:', err)
  }
}

/**
 * Muestra estructura de tablas
 */
export async function showTableStructure() {
  console.log(`
  📊 ESTRUCTURA DE ASISTENCIA
  
  1️⃣  attendance (resumen)
     - id: UUID
     - enrollment_id: UUID (FK → enrollments)
     - percentage: NUMERIC(5,2)
     - created_at: TIMESTAMP
     - updated_at: TIMESTAMP
  
  2️⃣  class_attendance (detalles por día)
     - id: UUID
     - enrollment_id: UUID (FK → enrollments)
     - date: DATE
     - present: BOOLEAN
     - note: TEXT
     - created_at: TIMESTAMP
     - updated_at: TIMESTAMP
     - UNIQUE(enrollment_id, date)
  `)
}
