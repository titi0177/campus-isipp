import { supabase } from '@/lib/supabase'

/**
 * Check if student passed all 1st year subjects on the same day
 * Returns the date if true, null otherwise
 */
export async function checkAdvancedStudentException(studentId: string): Promise<string | null> {
  try {
    // Get all 1st year subjects from student's program
    const { data: student } = await supabase
      .from('students')
      .select('program_id')
      .eq('id', studentId)
      .single()

    if (!student) return null

    const { data: firstYearSubjects } = await supabase
      .from('subjects')
      .select('id')
      .eq('program_id', student.program_id)
      .eq('year', 1)

    if (!firstYearSubjects || firstYearSubjects.length === 0) return null

    const firstYearSubjectIds = firstYearSubjects.map(s => s.id)

    // Get all enrollments with grades for 1st year subjects
    const { data: enrollments } = await supabase
      .from('enrollments')
      .select(`
        subject_id,
        enrollment_grades(final_status, created_at)
      `)
      .eq('student_id', studentId)
      .in('subject_id', firstYearSubjectIds)

    if (!enrollments) return null

    // Filter only passed/promoted grades
    const passedEnrollments = enrollments.filter(e => {
      const grade = Array.isArray(e.enrollment_grades) ? e.enrollment_grades[0] : e.enrollment_grades
      return grade && ['aprobado', 'promocionado'].includes(grade.final_status)
    })

    // Must have passed at least as many as there are 1st year subjects
    if (passedEnrollments.length < firstYearSubjectIds.length) {
      return null
    }

    // Get the dates when each subject was marked as passed/promoted
    const passedDates = passedEnrollments
      .map(e => {
        const grade = Array.isArray(e.enrollment_grades) ? e.enrollment_grades[0] : e.enrollment_grades
        if (grade && grade.created_at) {
          return new Date(grade.created_at).toDateString() // Normalize to date only
        }
        return null
      })
      .filter(Boolean) as string[]

    // Check if all passed on the same day (all dates are identical)
    if (passedDates.length > 0) {
      const firstDate = passedDates[0]
      const allSameDay = passedDates.every(d => d === firstDate)

      if (allSameDay) {
        // Return the actual date in ISO format
        const dateObj = new Date(firstDate)
        return dateObj.toISOString()
      }
    }

    return null
  } catch (err) {
    console.error('Error checking advanced student exception:', err)
    return null
  }
}

/**
 * Get all 1st year subjects for a student's program
 */
export async function getFirstYearSubjects(studentId: string): Promise<string[]> {
  try {
    const { data: student } = await supabase
      .from('students')
      .select('program_id')
      .eq('id', studentId)
      .single()

    if (!student) return []

    const { data: subjects } = await supabase
      .from('subjects')
      .select('id')
      .eq('program_id', student.program_id)
      .eq('year', 1)

    return subjects?.map(s => s.id) ?? []
  } catch (err) {
    console.error('Error getting 1st year subjects:', err)
    return []
  }
}
