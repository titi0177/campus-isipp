import { supabase } from '@/lib/supabase'

/**
 * Auto-enroll all students by year without duplicating
 * @param academicYear Optional academic year (defaults to current year)
 * @returns Result object with enrollment statistics
 */
export async function autoEnrollStudentsByYear(academicYear?: number) {
  try {
    const { data, error } = await supabase.rpc(
      'auto_enroll_students_by_year',
      { p_academic_year: academicYear || null }
    )

    if (error) {
      console.error('❌ Error en auto-inscripción:', error)
      throw error
    }

    if (!data || data.length === 0) {
      return {
        success: false,
        message: 'No se encontraron estudiantes para inscribir',
        data: [],
      }
    }

    // Procesar resultados
    const summary = {
      total_students: data.length,
      students_processed: data.filter((r: any) => !r.error_message).length,
      students_with_errors: data.filter((r: any) => r.error_message).length,
      total_subjects_enrolled: data.reduce((sum: number, row: any) => sum + (row.subjects_enrolled || 0), 0),
    }

    console.log('✅ Auto-inscripción completada:', summary)
    console.table(data)

    return {
      success: true,
      message: `Inscripción completada. ${summary.students_processed} estudiantes procesados.`,
      summary,
      data,
    }
  } catch (err) {
    console.error('Error en autoEnrollStudentsByYear:', err)
    throw err
  }
}

/**
 * Auto-enroll a single student without duplicating
 * @param studentId Student UUID
 * @param academicYear Optional academic year (defaults to current year)
 * @returns Result object with enrollment details
 */
export async function autoEnrollSingleStudent(studentId: string, academicYear?: number) {
  try {
    const { data, error } = await supabase.rpc(
      'auto_enroll_single_student',
      { p_student_id: studentId, p_academic_year: academicYear || null }
    )

    if (error) {
      console.error('❌ Error en auto-inscripción:', error)
      throw error
    }

    if (!data || !data.success) {
      return {
        success: false,
        message: data?.message || 'Error al inscribir estudiante',
      }
    }

    console.log('✅ Estudiante inscripto:', data)
    return data
  } catch (err) {
    console.error('Error en autoEnrollSingleStudent:', err)
    throw err
  }
}

/**
 * Get enrollment report for a student
 * @param studentId Student UUID
 * @returns Enrollment details
 */
export async function getStudentEnrollments(studentId: string) {
  try {
    const { data, error } = await supabase
      .from('enrollments')
      .select(`
        id,
        student_id,
        subject:subjects (id, name, year, code),
        academic_year,
        status,
        attempt_number,
        created_at
      `)
      .eq('student_id', studentId)
      .eq('academic_year', new Date().getFullYear())
      .order('subject.year', { ascending: true })

    if (error) throw error

    return {
      success: true,
      total_enrolled: data?.length || 0,
      enrollments: data,
    }
  } catch (err) {
    console.error('Error en getStudentEnrollments:', err)
    throw err
  }
}

/**
 * Get students missing required enrollments
 * Only counts enrollments for PRIOR years (not current year)
 * @param programId Program UUID (optional)
 * @returns List of students and missing enrollments
 */
export async function getStudentsMissingEnrollments(programId?: string) {
  try {
    const currentYear = new Date().getFullYear()

    // Obtener estudiantes de 2° y 3° año
    let query = supabase
      .from('students')
      .select('id, first_name, last_name, program_id, year')
      .in('year', [2, 3])
      .eq('status', 'active')

    // Solo filtrar por programa si se proporciona
    if (programId) {
      query = query.eq('program_id', programId)
    }

    const { data: students, error: studentError } = await query

    if (studentError) throw studentError
    if (!students || students.length === 0) {
      return {
        success: true,
        message: 'No hay estudiantes de 2° y 3° año',
        students_needing_enrollment: [],
      }
    }

    const results = []

    for (const student of students) {
      // Determinar materias ANTERIORES que debería tener (NO del año en curso)
      const yearFilter = student.year === 2 ? [1] : [1, 2]  // 2° solo 1°, 3° solo 1° y 2°

      // Obtener solo materias de años ANTERIORES
      const { data: requiredSubjects, error: subjectsError } = await supabase
        .from('subjects')
        .select('id')
        .eq('program_id', student.program_id)
        .in('year', yearFilter)  // Solo años anteriores

      if (subjectsError) continue

      // Verificar si está inscripto EN MATERIAS DE AÑOS ANTERIORES
      const { data: enrolled, error: enrollError } = await supabase
        .from('enrollments')
        .select('subject:subjects(id, year)')
        .eq('student_id', student.id)
        .eq('academic_year', currentYear)

      if (enrollError) continue

      // Filtrar solo los enrollments de años ANTERIORES
      const enrolledInPriorYears = enrolled
        ?.filter((e: any) => {
          const subjectYear = e.subject?.year
          return (student.year === 2 && subjectYear === 1) || 
                 (student.year === 3 && subjectYear && subjectYear <= 2)
        })
        ?.map((e: any) => e.subject.id) || []

      const enrolledIds = new Set(enrolledInPriorYears)
      const requiredIds = new Set(requiredSubjects?.map((s: any) => s.id) || [])

      const missing = [...requiredIds].filter(id => !enrolledIds.has(id))

      if (missing.length > 0) {
        results.push({
          student_id: student.id,
          name: `${student.last_name}, ${student.first_name}`,
          year: student.year,
          required_subjects: requiredIds.size,
          enrolled_subjects: enrolledIds.size,
          missing_subjects: missing.length,
        })
      }
    }

    return {
      success: true,
      total_students_checked: students.length,
      students_needing_enrollment: results,
    }
  } catch (err) {
    console.error('Error en getStudentsMissingEnrollments:', err)
    throw err
  }
}
