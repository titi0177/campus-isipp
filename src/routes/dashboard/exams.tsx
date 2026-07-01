import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Calendar, Clock, MapPin, User, AlertCircle } from 'lucide-react'
import { useToast } from '@/components/Toast'

function examDateString(exam: { exam_date?: string; date?: string }) {
  return exam.exam_date ?? exam.date ?? ''
}

function formatExamDate(exam: any) {
  const dateStr = exam.exam_date ?? exam.date ?? ''
  if (!dateStr) return ''
  
  const date = new Date(dateStr)
  return date.toLocaleDateString('es-AR')
}

export const Route = createFileRoute('/dashboard/exams')({
  component: ExamsPage,
})

function ExamsPage() {

  const [exams, setExams] = useState<any[]>([])
  const [student, setStudent] = useState<any>(null)
  const [registrations, setRegistrations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [eligibility, setEligibility] = useState<Map<string, { eligible: boolean; reasons: string[] }>>(new Map())
  const [paymentsCache, setPaymentsCache] = useState<any[]>([])

  const { showToast } = useToast()

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {

    try {

      setLoading(true)

      const { data: { user } } = await supabase.auth.getUser()

      if (!user) return

      const { data: studentData, error: studentError } = await supabase
        .from('students')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (studentError || !studentData) {
        showToast('No se encontró el estudiante', 'error')
        return
      }

      setStudent(studentData)

      // Cargar mesas, profesor y correlativas en paralelo
      const [examsResult, paymentsResult] = await Promise.all([
        supabase
          .from('final_exams')
          .select(`
            *,
            subject:subjects(id, name, professor_id, program_id, professor:professors(name))
          `)
          .eq('subject.program_id', studentData.program_id)
          .order('exam_date', { ascending: true }),
        supabase
          .from('payments')
          .select('*')
          .eq('student_id', studentData.id)
          .eq('status', 'deudor')
      ])

      const { data: examsData, error: examsError } = examsResult

      console.log('[EXAMS] Query result:', { examsData, examsError })

      if (examsError) {
        console.error('[EXAMS] Query error:', examsError)
        showToast(examsError.message, 'error')
        setExams([])
      } else {
        console.log('[EXAMS] examsData count:', examsData?.length)
        // Filtrar solo mesas que corresponden a la carrera del alumno
        const validExams = (examsData || []).filter(exam => exam.subject?.id && exam.subject?.name)
        console.log('[EXAMS] validExams count:', validExams?.length)
        setExams(validExams)
        setPaymentsCache(paymentsResult.data || [])
        
        // Verificar elegibilidad en background (no bloquea mesas)
        try {
          console.log('[EXAMS] Starting eligibility check')
          await checkEligibility(studentData, validExams, paymentsResult.data || [])
          console.log('[EXAMS] Eligibility check completed')
        } catch (eligError) {
          console.error('[EXAMS] Error verificando elegibilidad:', eligError)
        }
      }

      const { data: regData, error: regError } = await supabase
        .from('exam_enrollments')
        .select('*')
        .eq('student_id', studentData.id)

      if (regError) {
        showToast(regError.message, 'error')
        setRegistrations([])
      } else {
        setRegistrations(regData || [])
      }

    } catch {

      showToast('Error cargando mesas', 'error')

    } finally {
      setLoading(false)
    }

  }

  async function checkEligibility(studentData: any, examsData: any[], paymentsData: any[]) {
    console.log('[ELIGIBILITY] Starting with exams count:', examsData?.length)
    const eligMap = new Map()

    // Validar todas las mesas en paralelo
    await Promise.all(
      examsData.map(async (exam) => {
        const subjectId = exam.subject?.id
        console.log('[ELIGIBILITY] Checking exam:', exam.id, 'subject:', subjectId)
        
        const reasons: string[] = []
        let eligible = true

        // 0. PRIMERO: Verificar si ya está aprobado o promocionado
        const { data: enrollmentData } = await supabase
          .from('enrollments')
          .select('enrollment_grades(final_status)')
          .eq('student_id', studentData.id)
          .eq('subject_id', subjectId)
          .single()

        const finalStatus = Array.isArray(enrollmentData?.enrollment_grades)
          ? enrollmentData?.enrollment_grades[0]?.final_status
          : enrollmentData?.enrollment_grades?.final_status

        if (finalStatus && ['aprobado', 'promocionado'].includes(finalStatus)) {
          console.log('[ELIGIBILITY] Subject already approved:', subjectId)
          reasons.push(`Ya está aprobado - no requiere inscripción`)
          eligible = false
          eligMap.set(exam.id, { eligible, reasons })
          return
        }

        // 1. Verificar asistencia y parcial en una sola query
        const { data: attendanceGradeData } = await supabase
          .from('enrollments')
          .select('attendance(percentage), enrollment_grades(partial_grade)')
          .eq('student_id', studentData.id)
          .eq('subject_id', subjectId)
          .single()

        const attendance = Array.isArray(attendanceGradeData?.attendance) 
          ? attendanceGradeData?.attendance[0]?.percentage 
          : attendanceGradeData?.attendance?.percentage

        if (!attendance || attendance < 60) {
          reasons.push(`Asistencia insuficiente (actual: ${attendance ?? 0}%, mínimo: 60%)`)
          eligible = false
        }

        const gradeRecord = Array.isArray(attendanceGradeData?.enrollment_grades) 
          ? attendanceGradeData?.enrollment_grades[0] 
          : attendanceGradeData?.enrollment_grades
        
        const partialGrade = gradeRecord?.partial_grade

        if (!partialGrade || partialGrade < 6) {
          reasons.push(`Nota parcial insuficiente (actual: ${partialGrade ? Math.round(partialGrade * 100) / 100 : '—'}, mínimo: 6)`)
          eligible = false
        }

        // 2. Verificar correlativas
        const { data: correlativesData } = await supabase
          .from('subject_correlatives')
          .select('requires_subject_id, required_status')
          .eq('subject_id', subjectId)

        if (correlativesData && correlativesData.length > 0) {
          // Obtener estado de todas las correlativas en paralelo
          const correlativeStatuses = await Promise.all(
            correlativesData.map(async (corr) => {
              const { data: corrEnrollmentData } = await supabase
                .from('enrollments')
                .select('enrollment_grades(final_status)')
                .eq('student_id', studentData.id)
                .eq('subject_id', corr.requires_subject_id)
                .single()

              const finalStatus = Array.isArray(corrEnrollmentData?.enrollment_grades)
                ? corrEnrollmentData?.enrollment_grades[0]?.final_status
                : corrEnrollmentData?.enrollment_grades?.final_status

              return { corr, finalStatus }
            })
          )

          // Validar según required_status
          for (const { corr, finalStatus } of correlativeStatuses) {
            const requiredStatus = corr.required_status || 'aprobado'
            
            if (requiredStatus === 'aprobado') {
              if (!finalStatus || !['aprobado', 'promocionado'].includes(finalStatus)) {
                const { data: subjectName } = await supabase
                  .from('subjects')
                  .select('name')
                  .eq('id', corr.requires_subject_id)
                  .single()
                reasons.push(`Requiere APROBADA: ${subjectName?.name} (actual: ${finalStatus || 'Sin cursar'})`)
                eligible = false
              }
            } else if (requiredStatus === 'regular') {
              if (!finalStatus || !['aprobado', 'promocionado', 'regular'].includes(finalStatus)) {
                const { data: subjectName } = await supabase
                  .from('subjects')
                  .select('name')
                  .eq('id', corr.requires_subject_id)
                  .single()
                reasons.push(`Requiere REGULARIZADA: ${subjectName?.name} (actual: ${finalStatus || 'Sin cursar'})`)
                eligible = false
              }
            }
          }
        }

        // 3. Verificar pagos (usando cache)
        if (exam.exam_date) {
          const examDate = new Date(exam.exam_date)
          const examMonth = examDate.getMonth() + 1
          const examYear = examDate.getFullYear()

          const debtWithinDeadline = paymentsData.filter((p: any) => {
            const paymentDueDate = new Date(p.due_date)
            const paymentMonth = paymentDueDate.getMonth() + 1
            const paymentYear = paymentDueDate.getFullYear()
            
            if (paymentYear < examYear) return true
            if (paymentYear === examYear && paymentMonth <= examMonth) return true
            return false
          })

          if (debtWithinDeadline.length > 0) {
            const debtAmount = debtWithinDeadline.reduce((sum: number, p: any) => sum + p.amount, 0)
            reasons.push(`Tienes deuda de $${debtAmount !== null && debtAmount !== undefined ? debtAmount.toFixed(2) : '0.00'} con vencimiento antes de este examen`)
            eligible = false
          }
        }

        eligMap.set(exam.id, { eligible, reasons })
      })
    )

    setEligibility(eligMap)
  }

  function isRegistered(examId: string) {
    return registrations.some(r => r.final_exam_id === examId)
  }

  async function seatsTaken(examId: string) {

    const { count } = await supabase
      .from('exam_enrollments')
      .select('*', { count: 'exact', head: true })
      .eq('final_exam_id', examId)

    return count || 0
  }

  function examClosed(dateStr: string) {

    if (!dateStr) return true

    const exam = new Date(dateStr + (dateStr.length <= 10 ? 'T12:00:00' : ''))
    const now = new Date()

    const diff = exam.getTime() - now.getTime()
    const hours = diff / (1000 * 60 * 60)

    return hours < 24
  }

  async function registerExam(exam: any) {

    if (!student) return

    if (isRegistered(exam.id)) {
      showToast('Ya estás inscripto', 'info')
      return
    }

    const when = examDateString(exam)
    if (examClosed(when)) {
      showToast('La inscripción cierra 24 hs antes del examen', 'error')
      return
    }

    const maxStudents = exam.max_students
    if (maxStudents != null && maxStudents > 0) {
      const taken = await seatsTaken(exam.id)
      if (taken >= maxStudents) {
        showToast('No hay cupos disponibles', 'error')
        return
      }
    }

    // Verificar elegibilidad
    const examEligibility = eligibility.get(exam.id)
    if (!examEligibility?.eligible) {
      const reasons = examEligibility?.reasons || ['Requisitos no cumplidos']
      showToast(`No cumples los requisitos:\n${reasons.join('\n')}`, 'error')
      return
    }

    const { error } = await supabase
      .from('exam_enrollments')
      .insert({
        final_exam_id: exam.id,
        student_id: student.id,
      })

    if (error) {

      showToast(error.message, 'error')

      return
    }

    showToast('Inscripción realizada')

    loadData()
  }

  async function cancelRegistration(examId: string) {

    if (!student) return

    const { error } = await supabase
      .from('exam_enrollments')
      .delete()
      .eq('final_exam_id', examId)
      .eq('student_id', student.id)

    if (error) {

      showToast('Error cancelando inscripción', 'error')

      return
    }

    showToast('Inscripción cancelada')

    loadData()
  }

  if (loading) {
    return <p>Cargando mesas...</p>
  }

  return (

    <div className="space-y-6">

      <h1 className="text-2xl font-bold">
        Mesas de Examen
      </h1>

      {exams.length === 0 && (
        <p>No hay mesas disponibles</p>
      )}

      <div className="space-y-4">

        {exams.map(exam => {

          const registered = isRegistered(exam.id)
          const when = examDateString(exam)
          const closed = examClosed(when)
          const examEligibility = eligibility.get(exam.id)
          const canRegister = !registered && !closed && examEligibility?.eligible

          return (

            <div
              key={exam.id}
              className="bg-white rounded-lg shadow p-6 space-y-3"
            >

              <div className="flex justify-between items-start">
                <div className="space-y-2 flex-1">

                  <p className="font-semibold text-lg">
                    {exam.subject?.name}
                  </p>

                  <div className="text-sm text-gray-500 flex gap-4">

                    <span className="flex items-center gap-1">
                      <Calendar size={14} />
                      {formatExamDate(exam) || '—'}
                    </span>

                    <span className="flex items-center gap-1">
                      <Clock size={14} />
                      {exam.exam_time || '—'}
                    </span>

                    <span className="flex items-center gap-1">
                      <MapPin size={14} />
                      {exam.location}
                    </span>

                  </div>

                  <p className="text-sm text-gray-500 flex items-center gap-1">
                    <User size={14} />
                    {exam.subject?.professor?.name || '—'}
                  </p>

                </div>

                {registered ? (

                  <button
                    type="button"
                    onClick={() => cancelRegistration(exam.id)}
                    className="btn-secondary px-4 py-2 text-slate-700 whitespace-nowrap"
                  >
                    Cancelar inscripción
                  </button>

                ) : closed ? (

                  <span className="text-red-600 font-semibold whitespace-nowrap">
                    Inscripción cerrada
                  </span>

                ) : (

                  <button
                    type="button"
                    onClick={() => registerExam(exam)}
                    disabled={!canRegister}
                    className={`px-4 py-2 whitespace-nowrap ${
                      canRegister
                        ? 'btn-primary'
                        : 'bg-gray-300 text-gray-600 cursor-not-allowed rounded'
                    }`}
                  >
                    Inscribirse
                  </button>

                )}
              </div>

              {/* Mostrar requisitos no cumplidos */}
              {!registered && !closed && !examEligibility?.eligible && (
                <div className="bg-red-50 border border-red-200 rounded p-3 text-sm text-red-700 space-y-1">
                  <div className="flex items-center gap-2 font-semibold">
                    <AlertCircle size={16} />
                    Requisitos no cumplidos:
                  </div>
                  <ul className="ml-6 space-y-0.5">
                    {examEligibility?.reasons?.map((reason, idx) => (
                      <li key={idx}>• {reason}</li>
                    ))}
                  </ul>
                </div>
              )}

            </div>

          )

        })}

      </div>

    </div>

  )

}
