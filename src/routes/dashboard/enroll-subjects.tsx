import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/components/Toast'
import { Plus, Check, Lock, AlertCircle, RefreshCw, Zap, X } from 'lucide-react'
import { checkAdvancedStudentException, getFirstYearSubjects } from '@/lib/advancedStudentUtils'

export const Route = createFileRoute('/dashboard/enroll-subjects')({
  component: EnrollSubjectsPage,
})

type SubjectWithStatus = {
  id: string
  name: string
  code: string
  year: number
  baseSubjectId?: string
  dictation_type: string
  semester: number
  professor_id?: string
  professor?: { name: string }
  canEnroll: boolean
  blockedReason?: string
  isEnrolled: boolean
  isRecursant?: boolean
  hasMultipleDivisions?: boolean
}

type DivisionModalData = {
  subjectId: string
  subjectName: string
  year: number
} | null

function EnrollSubjectsPage() {
  const [student, setStudent] = useState<any>(null)
  const [availableSubjects, setAvailableSubjects] = useState<SubjectWithStatus[]>([])
  const [loading, setLoading] = useState(true)
  const [isAdvancedStudent, setIsAdvancedStudent] = useState(false)
  const [advancedExceptionDate, setAdvancedExceptionDate] = useState<string | null>(null)
  const [enrolledDivision, setEnrolledDivision] = useState<string | null>(null)
  const [divisionModal, setDivisionModal] = useState<DivisionModalData>(null)
  const { showToast } = useToast()

  const currentYear = new Date().getFullYear()
  const currentMonth = new Date().getMonth() + 1
  const isFirstSemester = currentMonth <= 6

  useEffect(() => {
    void loadData()
  }, [])

  async function loadData() {
    try {
      setLoading(true)

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: studentData } = await supabase
        .from('students')
        .select('*, program:programs(name)')
        .eq('user_id', user.id)
        .single()

      if (!studentData) return
      setStudent(studentData)

      const exceptionDate = await checkAdvancedStudentException(studentData.id)
      if (exceptionDate) {
        setIsAdvancedStudent(true)
        setAdvancedExceptionDate(exceptionDate)
      }

      const { data: allSubjects } = await supabase
        .from('subjects')
        .select('id, name, code, year, division, professor_id, professor:professors(name), dictation_type, semester')
        .eq('program_id', studentData.program_id)
        .order('year')
        .order('code')

      if (!allSubjects) {
        setAvailableSubjects([])
        return
      }

      const subjectNameMap = new Map(
        allSubjects.map((s: any) => [s.id, s.name])
      )

      const { data: currentYearEnrollments } = await supabase
        .from('enrollments')
        .select('subject_id, division, grades(status), academic_year, subject:subjects(year)')
        .eq('student_id', studentData.id)
        .eq('academic_year', currentYear)

      const { data: allEnrollments } = await supabase
        .from('enrollments')
        .select('subject_id, grades(status), academic_year')
        .eq('student_id', studentData.id)

      const firstYearEnrollments = currentYearEnrollments?.filter(e => {
        const year = (e as any).subject?.year
        return year === 1 && e.division
      })

      if (firstYearEnrollments && firstYearEnrollments.length > 0) {
        const division = (firstYearEnrollments[0] as any).division
        setEnrolledDivision(division)
      }

      const enrolledThisYearByAnyYear = new Map<number, boolean>()
      const currentYearEnrollmentIds = new Set(currentYearEnrollments?.map(e => e.subject_id) ?? [])

      if (currentYearEnrollments) {
        for (const enr of currentYearEnrollments) {
          const year = (enr as any).subject?.year
          if (year) {
            enrolledThisYearByAnyYear.set(year, true)
          }
        }
      }

      const passedSubjectIds = new Set(
        (allEnrollments ?? [])
          .filter(e => {
            const g = Array.isArray(e.grades) ? e.grades[0] : e.grades
            return g && ['promoted', 'passed', 'regular'].includes(g.status)
          })
          .map(e => e.subject_id)
      )

      const { data: correlatives } = await supabase
        .from('subject_correlatives')
        .select('subject_id, requires_subject_id')

      const requiresMap = new Map<string, string[]>()

      for (const c of correlatives ?? []) {
        const arr = requiresMap.get(c.subject_id) ?? []
        arr.push(c.requires_subject_id)
        requiresMap.set(c.subject_id, arr)
      }

      const firstYearSubjectIds = await getFirstYearSubjects(studentData.id)

      // Agrupar materias por nombre base (sin división)
      const subjectsByBase = new Map<string, any[]>()
      for (const subject of allSubjects) {
        const baseKey = `${subject.name}_${subject.code}`
        if (!subjectsByBase.has(baseKey)) {
          subjectsByBase.set(baseKey, [])
        }
        subjectsByBase.get(baseKey)!.push(subject)
      }

      const processed: SubjectWithStatus[] = []

      for (const [, variants] of subjectsByBase) {
        // Usar la primera variante como referencia
        const subject = variants[0]
        const isEnrolledThisYear = currentYearEnrollmentIds.has(subject.id)
        const isPassed = passedSubjectIds.has(subject.id)
        const isRecursant = !isPassed && passedSubjectIds.has(subject.id) === false && 
                           allEnrollments?.some(e => e.subject_id === subject.id)

        let canEnroll = false
        let blockedReason = ''

        if (isEnrolledThisYear) {
          blockedReason = 'Ya inscripto este año'
        } else if (isPassed) {
          blockedReason = 'Ya aprobada/promocionada'
        } 
        else if (isRecursant) {
          const reqs = requiresMap.get(subject.id) ?? []
          const allReqsPassed = reqs.every(rid => passedSubjectIds.has(rid))

          if (!allReqsPassed) {
            const missingReqs = reqs.filter(rid => !passedSubjectIds.has(rid))
            const missingNames = missingReqs
              .map(id => subjectNameMap.get(id))
              .filter(Boolean)
              .join(', ')
            blockedReason = `Requiere (recursante): ${missingNames}`
          } else {
            if (subject.dictation_type === 'cuatrimestral') {
              if (subject.semester === 1 && !isFirstSemester) {
                blockedReason = '1er cuatrimestre (hasta julio)'
              } else if (subject.semester === 2 && isFirstSemester) {
                blockedReason = '2do cuatrimestre (desde julio)'
              } else {
                canEnroll = true
              }
            } else {
              canEnroll = true
            }
          }
        }
        else {
          if (isAdvancedStudent && subject.year === studentData.year + 1) {
            const reqs = requiresMap.get(subject.id) ?? []
            const allReqsPassed = reqs.every(rid => passedSubjectIds.has(rid))

            if (!allReqsPassed) {
              const missingReqs = reqs.filter(rid => !passedSubjectIds.has(rid))
              const missingNames = missingReqs
                .map(id => subjectNameMap.get(id))
                .filter(Boolean)
                .join(', ')
              blockedReason = `Requiere: ${missingNames}`
            } else {
              if (subject.dictation_type === 'cuatrimestral') {
                if (subject.semester === 1 && !isFirstSemester) {
                  blockedReason = '1er cuatrimestre (hasta julio)'
                } else if (subject.semester === 2 && isFirstSemester) {
                  blockedReason = '2do cuatrimestre (desde julio)'
                } else {
                  canEnroll = true
                }
              } else {
                canEnroll = true
              }
            }
          }
          else if (subject.year !== studentData.year) {
            blockedReason = `Año ${subject.year} (Tu año actual: ${studentData.year})`
          } else {
            const reqs = requiresMap.get(subject.id) ?? []
            const allReqsPassed = reqs.every(rid => passedSubjectIds.has(rid))

            if (!allReqsPassed) {
              const missingReqs = reqs.filter(rid => !passedSubjectIds.has(rid))
              const missingNames = missingReqs
                .map(id => subjectNameMap.get(id))
                .filter(Boolean)
                .join(', ')
              blockedReason = `Requiere: ${missingNames}`
            } else {
              if (subject.dictation_type === 'cuatrimestral') {
                if (subject.semester === 1 && !isFirstSemester) {
                  blockedReason = '1er cuatrimestre (hasta julio)'
                } else if (subject.semester === 2 && isFirstSemester) {
                  blockedReason = '2do cuatrimestre (desde julio)'
                } else {
                  canEnroll = true
                }
              } else {
                canEnroll = true
              }
            }
          }
        }

        processed.push({
          id: subject.id,
          name: subject.name,
          code: subject.code,
          year: subject.year,
          dictation_type: subject.dictation_type || 'anual',
          semester: subject.semester || 1,
          professor_id: subject.professor_id,
          professor: subject.professor,
          canEnroll,
          blockedReason,
          isEnrolled: isEnrolledThisYear || isPassed,
          isRecursant: isRecursant && !isEnrolledThisYear && !isPassed,
          hasMultipleDivisions: variants.length > 1,
        })
      }

      processed.sort((a, b) => a.year - b.year)

      setAvailableSubjects(processed)

    } catch (err) {
      console.error('Error loading:', err)
      showToast('Error cargando materias', 'error')
    } finally {
      setLoading(false)
    }
  }

  async function enrollSubject(subjectId: string, division: string | null) {
    if (!student) return

    const { error } = await supabase
      .from('enrollments')
      .insert({
        student_id: student.id,
        subject_id: subjectId,
        academic_year: currentYear,
        division: division,
        status: 'active',
      })

    if (error) {
      showToast('Error al inscribirse: ' + error.message, 'error')
      return
    }

    showToast('Inscripción completada')
    setDivisionModal(null)
    void loadData()
  }

  function handleEnrollClick(subject: SubjectWithStatus) {
    if (subject.year === 1 && subject.hasMultipleDivisions) {
      // Mostrar modal para elegir división
      setDivisionModal({
        subjectId: subject.id,
        subjectName: subject.name,
        year: subject.year,
      })
    } else {
      // Inscribir directamente sin división
      enrollSubject(subject.id, null)
    }
  }

  if (loading) {
    return <p className="text-slate-600">Cargando materias...</p>
  }

  const filteredSubjects = availableSubjects.filter(subject => {
    if (subject.year === 1 && subject.hasMultipleDivisions) {
      if (enrolledDivision) {
        return false
      }
    }
    return true
  })

  const enrolledCount = filteredSubjects.filter(s => s.isEnrolled).length
  const availableCount = filteredSubjects.filter(s => s.canEnroll && !s.isEnrolled).length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Inscripción a Materias</h1>
        <p className="text-gray-500 text-sm mt-1">
          Año actual: {currentYear} | Período: {isFirstSemester ? '1er cuatrimestre' : '2do cuatrimestre'}
        </p>
      </div>

      {enrolledDivision && (
        <div className="card p-4 border-l-4 border-l-blue-600 bg-blue-50 border border-blue-200">
          <div className="flex items-start gap-3">
            <Check size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-blue-900">División Seleccionada</h3>
              <p className="text-sm text-blue-800 mt-1">
                Estás inscripto en <strong>División {enrolledDivision}</strong> para materias de primer año.
              </p>
            </div>
          </div>
        </div>
      )}

      {isAdvancedStudent && advancedExceptionDate && (
        <div className="card p-4 border-l-4 border-l-yellow-500 bg-yellow-50 border border-yellow-200">
          <div className="flex items-start gap-3">
            <Zap size={20} className="text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-yellow-900">✨ Estado Especial: Alumno Avanzado</h3>
              <p className="text-sm text-yellow-800 mt-1">
                ¡Excelente desempeño! Has aprobado todas las materias del primer año el{' '}
                <strong>{new Date(advancedExceptionDate).toLocaleDateString('es-AR')}</strong>.
              </p>
              <p className="text-sm text-yellow-800 mt-1">
                Por este logro, estás habilitado para inscribirte en materias del siguiente año.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="card p-4 bg-blue-50 border border-blue-200">
          <p className="text-sm text-blue-600">Inscriptos</p>
          <p className="text-2xl font-bold text-blue-900">{enrolledCount}</p>
        </div>
        <div className="card p-4 bg-green-50 border border-green-200">
          <p className="text-sm text-green-600">Disponibles</p>
          <p className="text-2xl font-bold text-green-900">{availableCount}</p>
        </div>
        <div className="card p-4 bg-gray-50 border border-gray-200">
          <p className="text-sm text-gray-600">Total del programa</p>
          <p className="text-2xl font-bold text-gray-900">{availableSubjects.length}</p>
        </div>
      </div>

      <div className="space-y-4">
        {filteredSubjects.length === 0 ? (
          <p className="text-slate-600">No hay materias disponibles en tu programa.</p>
        ) : (
          filteredSubjects.map((subject) => (
            <div
              key={subject.id}
              className={`card p-4 flex items-center justify-between ${
                subject.isEnrolled
                  ? 'bg-blue-50 border-l-4 border-l-blue-600'
                  : subject.canEnroll
                    ? 'bg-green-50 border-l-4 border-l-green-600'
                    : 'bg-gray-50 border-l-4 border-l-gray-300'
              }`}
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-sm font-semibold text-slate-500">{subject.code}</span>
                  <h3 className="font-semibold text-gray-900">{subject.name}</h3>
                  <span className="text-xs bg-slate-200 text-slate-700 px-2 py-1 rounded">
                    Año {subject.year}
                  </span>
                  {subject.hasMultipleDivisions && (
                    <span className="text-xs bg-purple-200 text-purple-700 px-2 py-1 rounded">
                      Divisiones A y B
                    </span>
                  )}
                  {subject.dictation_type === 'cuatrimestral' && (
                    <span className="text-xs bg-amber-200 text-amber-700 px-2 py-1 rounded">
                      {subject.semester === 1 ? '1er C.' : '2do C.'}
                    </span>
                  )}
                  {subject.isRecursant && (
                    <span className="text-xs bg-orange-200 text-orange-700 px-2 py-1 rounded flex items-center gap-1">
                      <RefreshCw size={12} /> Recursante
                    </span>
                  )}
                </div>

                {subject.professor && (
                  <p className="text-sm text-slate-600 mt-1">
                    Profesor: {subject.professor.name}
                  </p>
                )}

                {subject.blockedReason && (
                  <div className="flex items-center gap-1 mt-2 text-xs text-slate-600">
                    <AlertCircle size={14} />
                    {subject.blockedReason}
                  </div>
                )}
              </div>

              {subject.isEnrolled ? (
                <button
                  disabled
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded cursor-not-allowed"
                >
                  <Check size={18} />
                  Inscripto
                </button>
              ) : subject.canEnroll ? (
                <button
                  onClick={() => handleEnrollClick(subject)}
                  className="flex items-center gap-2 px-4 py-2 btn-primary"
                >
                  <Plus size={18} />
                  Inscribirse
                </button>
              ) : (
                <button
                  disabled
                  className="flex items-center gap-2 px-4 py-2 bg-gray-300 text-gray-600 rounded cursor-not-allowed"
                >
                  <Lock size={18} />
                  Bloqueada
                </button>
              )}
            </div>
          ))
        )}
      </div>

      {/* Modal de selección de división */}
      {divisionModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="card p-8 max-w-md mx-4 rounded-2xl">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Selecciona División</h2>
                <p className="text-sm text-gray-600 mt-1">{divisionModal.subjectName}</p>
              </div>
              <button
                onClick={() => setDivisionModal(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>

            <p className="text-sm text-gray-700 mb-6">
              ¿En qué división deseas inscribirte?
            </p>

            <div className="space-y-3">
              <button
                onClick={() => enrollSubject(divisionModal.subjectId, 'A')}
                className="w-full p-4 border-2 border-blue-300 bg-blue-50 hover:bg-blue-100 rounded-lg font-semibold text-blue-900 transition-colors"
              >
                División A
              </button>
              <button
                onClick={() => enrollSubject(divisionModal.subjectId, 'B')}
                className="w-full p-4 border-2 border-indigo-300 bg-indigo-50 hover:bg-indigo-100 rounded-lg font-semibold text-indigo-900 transition-colors"
              >
                División B
              </button>
            </div>

            <p className="text-xs text-gray-500 text-center mt-4">
              Una vez seleccionada una división, solo verás materias de esa división.
            </p>
          </div>
        </div>
      )}

      {/* Información */}
      <div className="card p-4 bg-blue-50 border border-blue-200 space-y-2">
        <h3 className="font-semibold text-blue-900">ℹ️ Reglas de inscripción</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• <strong>Divisiones (Año 1):</strong> Al inscribirte en una materia de primer año, elige tu división (A o B)</li>
          <li>• <strong>Una división por vez:</strong> Una vez seleccionada, solo verás materias de esa división</li>
          <li>• <strong>Alumnos nuevos:</strong> Solo pueden inscribirse en su año actual y recursantes en años anteriores</li>
          <li>• <strong>Alumnos avanzados:</strong> Si aprueban todas las materias del primer año el mismo día, pueden inscribirse en años superiores</li>
          <li>• <strong>Correlativas:</strong> Debes haber aprobado las materias requisito antes de inscribirte</li>
          <li>• <strong>Cuatrimestrales:</strong> Solo disponibles en su período correspondiente</li>
        </ul>
      </div>
    </div>
  )
}
