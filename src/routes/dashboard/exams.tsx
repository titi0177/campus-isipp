import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Calendar, MapPin, User, AlertCircle } from 'lucide-react'
import { useToast } from '@/components/Toast'

function examDateString(exam: { exam_date?: string; date?: string }) {
  return exam.exam_date ?? exam.date ?? ''
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

      const { data: examsData, error: examsError } = await supabase
        .from('final_exams')
        .select(`
          *,
          subject:subjects!final_exams_subject_id_fkey(id, name),
          professor:professors!final_exams_professor_id_fkey(name)
        `)
        .order('exam_date', { ascending: true })

      if (examsError) {
        showToast(examsError.message, 'error')
        setExams([])
      } else {
        setExams(examsData || [])
        
        // Verificar elegibilidad para cada examen
        await checkEligibility(studentData, examsData || [])
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

  async function checkEligibility(studentData: any, examsData: any[]) {
    const eligMap = new Map()

    for (const exam of examsData) {
      const subjectId = exam.subject?.id
      
      const reasons: string[] = []
      let eligible = true

      // 1. Verificar asistencia (> 60%)
      const { data: attendanceData } = await supabase
        .from('enrollments')
        .select('attendance(percentage)')
        .eq('student_id', studentData.id)
        .eq('subject_id', subjectId)
        .single()

      const attendance = Array.isArray(attendanceData?.attendance) 
        ? attendanceData?.attendance[0]?.percentage 
        : attendanceData?.attendance?.percentage

      if (!attendance || attendance < 60) {
        reasons.push(`Asistencia insuficiente (actual: ${attendance ?? 0}%, mínimo: 60%)`)
        eligible = false
      }

      // 2. Verificar nota parcial (>= 6)
      const { data: gradeData } = await supabase
        .from('enrollments')
        .select('grades(partial_1, partial_2, partial_3, practical_1, practical_2, practical_3, partial_grade)')
        .eq('student_id', studentData.id)
        .eq('subject_id', subjectId)
        .single()

      const gradeRecord = gradeData?.grades
      
      // Intentar usar partial_grade (si existe) o calcular desde componentes
      let partialGrade: number | null = null
      
      if (gradeRecord?.partial_grade !== undefined && gradeRecord?.partial_grade !== null) {
        // Si existe partial_grade, usar ese
        partialGrade = gradeRecord.partial_grade
      } else if (gradeRecord) {
        // Si no, calcular desde componentes
        const partials = [gradeRecord.partial_1, gradeRecord.partial_2, gradeRecord.partial_3].filter(p => p != null)
        const practicals = [gradeRecord.practical_1, gradeRecord.practical_2, gradeRecord.practical_3].filter(p => p != null)
        const allGrades = [...partials, ...practicals]
        if (allGrades.length > 0) {
          partialGrade = allGrades.reduce((a, b) => a + b, 0) / allGrades.length
        }
      }

      if (!partialGrade || partialGrade < 6) {
        reasons.push(`Nota parcial insuficiente (actual: ${partialGrade ? Math.round(partialGrade * 100) / 100 : '—'}, mínimo: 6)`)
        eligible = false
      }

      // 3. Verificar correlativas
      const { data: correlativesData } = await supabase
        .from('subject_correlatives')
        .select('requires_subject_id')
        .eq('subject_id', subjectId)

      if (correlativesData && correlativesData.length > 0) {
        const requiredSubjectIds = correlativesData.map((c: any) => c.requires_subject_id)
        
        // Verificar si todas las correlativas están aprobadas
        const { data: passedEnrollments } = await supabase
          .from('enrollments')
          .select('subject_id, grades(status)')
          .eq('student_id', studentData.id)
          .in('subject_id', requiredSubjectIds)

        const passedSubjectIds = new Set(
          (passedEnrollments || [])
            .filter((e: any) => {
              const g = Array.isArray(e.grades) ? e.grades[0] : e.grades
              return g && ['promoted', 'passed', 'regular'].includes(g.status)
            })
            .map((e: any) => e.subject_id)
        )

        const missingCorrelatives = requiredSubjectIds.filter((id: string) => !passedSubjectIds.has(id))
        
        if (missingCorrelatives.length > 0) {
          // Obtener nombres de las correlativas faltantes
          const { data: missingSubjects } = await supabase
            .from('subjects')
            .select('name')
            .in('id', missingCorrelatives)

          const missingNames = missingSubjects?.map((s: any) => s.name).join(', ') || 'Correlativas no aprobadas'
          reasons.push(`Correlativas pendientes: ${missingNames}`)
          eligible = false
        }
      }

      // 4. Verificar pagos (deuda con vencimiento <= mes del examen)
      if (exam.exam_date) {
        const examDate = new Date(exam.exam_date)
        const examMonth = examDate.getMonth() + 1
        const examYear = examDate.getFullYear()

        const { data: paymentsData } = await supabase
          .from('payments')
          .select('*')
          .eq('student_id', studentData.id)
          .eq('status', 'deudor')

        const debtWithinDeadline = paymentsData?.filter((p: any) => {
          const paymentDueDate = new Date(p.due_date)
          const paymentMonth = paymentDueDate.getMonth() + 1
          const paymentYear = paymentDueDate.getFullYear()
          
          // Deuda con vencimiento <= mes/año del examen
          if (paymentYear < examYear) return true
          if (paymentYear === examYear && paymentMonth <= examMonth) return true
          return false
        }) || []

        if (debtWithinDeadline.length > 0) {
          const debtAmount = debtWithinDeadline.reduce((sum: number, p: any) => sum + p.amount, 0)
          reasons.push(`Tienes deuda de $${debtAmount !== null && debtAmount !== undefined ? debtAmount.toFixed(2) : '0.00'} con vencimiento antes de este examen`)
          eligible = false
        }
      }

      eligMap.set(exam.id, { eligible, reasons })
    }

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
                      {when || '—'}
                    </span>

                    <span className="flex items-center gap-1">
                      <MapPin size={14} />
                      {exam.location}
                    </span>

                  </div>

                  <p className="text-sm text-gray-500 flex items-center gap-1">
                    <User size={14} />
                    {exam.professor?.name}
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
