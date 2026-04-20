import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { ChevronDown, ChevronUp, Book, User, BarChart3, CheckCircle2, AlertCircle, Zap, Award } from 'lucide-react'

export const Route = createFileRoute('/dashboard/subjects')({
  component: SubjectsPage,
})

type EnrollmentWithGrades = {
  id: string
  student_id: string
  subject_id: string
  division?: string
  status: string
  subject: {
    id: string
    name: string
    code: string
    year: number
    division?: string
    credits: number
    allows_promotion: boolean
    professor_id: string
  }
  professor?: {
    id: string
    name: string
  }
  grades: {
    id: string
    grade_1?: number
    grade_2?: number
    grade_3?: number
    grade_4?: number
    grade_5?: number
    grade_6?: number
    partial_grade?: number
    final_grade?: number
    partial_status?: string
    final_status?: string
  } | null
  attendance: {
    percentage: number
  }[] | null
}

function SubjectsPage() {
  const [enrollments, setEnrollments] = useState<EnrollmentWithGrades[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setError('No autenticado')
        setLoading(false)
        return
      }

      const { data: student } = await supabase
        .from('students')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (!student) {
        setError('Estudiante no encontrado')
        setLoading(false)
        return
      }

      // Obtener enrollments con la nueva tabla enrollment_grades
      const { data, error: queryError } = await supabase
        .from('enrollments')
        .select(`
          id,
          student_id,
          subject_id,
          division,
          status,
          subject:subjects(
            id,
            name,
            code,
            year,
            division,
            credits,
            allows_promotion,
            professor_id
          ),
          enrollment_grades(
            id,
            grade_1,
            grade_2,
            grade_3,
            grade_4,
            grade_5,
            grade_6,
            partial_grade,
            final_grade,
            partial_status,
            final_status
          ),
          attendance(id, percentage)
        `)
        .eq('student_id', student.id)

      if (queryError) {
        console.error('Query error:', queryError)
        setError(`Error: ${queryError.message}`)
        setLoading(false)
        return
      }

      const enrollmentsWithProfs: EnrollmentWithGrades[] = []

      if (data && data.length > 0) {
        const profIds = [...new Set(data.map(e => e.subject?.professor_id).filter(Boolean))]

        let professors: any[] = []
        if (profIds.length > 0) {
          const { data: profsData } = await supabase
            .from('professors')
            .select('id, name')
            .in('id', profIds)
          professors = profsData || []
        }

        for (const enrollment of data) {
          const profId = enrollment.subject?.professor_id
          const prof = professors.find(p => p.id === profId)
          
          // Obtener el primer grade si existe
          const gradeArray = enrollment.enrollment_grades as any[]
          const grades = Array.isArray(gradeArray) && gradeArray.length > 0 ? gradeArray[0] : null

          enrollmentsWithProfs.push({
            ...enrollment,
            professor: prof || undefined,
            grades: grades,
          })
        }
      }

      setEnrollments(enrollmentsWithProfs)
    } catch (err) {
      console.error('Error loading subjects:', err)
      setError('Error al cargar materias')
    } finally {
      setLoading(false)
    }
  }

  function toggleExpanded(id: string) {
    setExpandedId(expandedId === id ? null : id)
  }

  const stats = {
    approved: enrollments.filter(e => e.grades?.final_status === 'aprobado').length,
    promoted: enrollments.filter(e => e.grades?.final_status === 'promocionado').length,
    current: enrollments.filter(e => !e.grades?.final_status || e.grades?.final_status === null).length,
  }

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-3xl p-8 text-white shadow-2xl animate-pulse">
          <h1 className="text-4xl font-black mb-2 h-12 bg-white/20 rounded w-1/2"></h1>
          <p className="text-indigo-100 h-6 bg-white/10 rounded w-2/3"></p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="card p-6 animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-6"></div>
              <div className="grid grid-cols-3 gap-4">
                <div className="h-20 bg-gray-200 rounded"></div>
                <div className="h-20 bg-gray-200 rounded"></div>
                <div className="h-20 bg-gray-200 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header Hero */}
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-3xl p-8 text-white shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-indigo-100 text-sm font-semibold mb-2">Mi Desempeño</p>
            <h1 className="text-5xl font-black mb-3">Mis Cursadas</h1>
            <p className="text-indigo-100 text-lg max-w-2xl">Seguimiento detallado de tu progreso académico en todas las materias</p>
          </div>
          <Book size={80} className="opacity-20" />
        </div>
      </div>

      {/* Stats Cards */}
      {enrollments.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="card p-6 border-l-4 border-l-emerald-600 bg-gradient-to-br from-emerald-50 to-teal-50">
            <p className="text-xs text-emerald-600 font-bold mb-3 uppercase tracking-wide">APROBADAS</p>
            <p className="text-4xl font-black text-emerald-700">{stats.approved}</p>
            <p className="text-sm text-emerald-600 mt-2">Materias completadas</p>
          </div>

          <div className="card p-6 border-l-4 border-l-purple-600 bg-gradient-to-br from-purple-50 to-pink-50">
            <p className="text-xs text-purple-600 font-bold mb-3 uppercase tracking-wide">PROMOCIONADAS</p>
            <p className="text-4xl font-black text-purple-700">{stats.promoted}</p>
            <p className="text-sm text-purple-600 mt-2">Con nota ≥8</p>
          </div>

          <div className="card p-6 border-l-4 border-l-blue-600 bg-gradient-to-br from-blue-50 to-cyan-50">
            <p className="text-xs text-blue-600 font-bold mb-3 uppercase tracking-wide">EN CURSO</p>
            <p className="text-4xl font-black text-blue-700">{stats.current}</p>
            <p className="text-sm text-blue-600 mt-2">En progreso</p>
          </div>
        </div>
      )}

      {error && (
        <div className="card p-4 bg-red-50 border-2 border-red-200 rounded-lg flex items-center gap-3">
          <AlertCircle className="text-red-600" size={20} />
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {enrollments.length === 0 ? (
        <div className="card p-16 text-center rounded-3xl bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-gray-200">
          <Book size={64} className="mx-auto text-gray-400 mb-6" />
          <p className="text-gray-600 text-xl font-semibold">No tienes materias inscriptas</p>
          <p className="text-gray-500 mt-2">Dirígete a inscripciones para agregar tus materias</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {enrollments.map(enr => {
            const subject = enr.subject
            const professor = enr.professor
            const grades = enr.grades
            const att = enr.attendance?.[0]

            const isExpanded = expandedId === enr.id

            // Recolectar notas cargadas
            const partialGrades = [grades?.grade_1, grades?.grade_2, grades?.grade_3, grades?.grade_4, grades?.grade_5, grades?.grade_6].filter(g => g != null)
            const partialGrade = grades?.partial_grade
            const finalGrade = grades?.final_grade
            const partialStatus = grades?.partial_status
            const finalStatus = grades?.final_status
            const attendance = att?.percentage

            // Determinar estado para mostrar
            let displayStatus = 'en_curso'
            if (finalGrade) {
              if (finalGrade >= 8 && subject.allows_promotion) {
                displayStatus = 'promocionado'
              } else if (finalGrade >= 6) {
                displayStatus = 'aprobado'
              } else {
                displayStatus = 'desaprobado'
              }
            } else if (partialStatus) {
              displayStatus = partialStatus
            }

            const getCardStyle = () => {
              if (finalGrade && finalGrade >= 8 && subject.allows_promotion) {
                return 'border-purple-600 bg-gradient-to-br from-purple-50 via-pink-50 to-purple-50'
              }
              if (finalGrade && finalGrade >= 6) {
                return 'border-emerald-600 bg-gradient-to-br from-emerald-50 via-teal-50 to-emerald-50'
              }
              if (finalGrade && finalGrade < 6) {
                return 'border-red-600 bg-gradient-to-br from-red-50 via-rose-50 to-red-50'
              }
              return 'border-indigo-600 bg-gradient-to-br from-indigo-50 via-blue-50 to-indigo-50'
            }

            return (
              <div
                key={enr.id}
                className={`card overflow-hidden rounded-3xl border-2 transition-all duration-300 hover:shadow-2xl hover:scale-105 ${getCardStyle()} ${
                  isExpanded ? 'ring-2 ring-indigo-400' : ''
                }`}
              >
                {/* Header */}
                <button
                  onClick={() => toggleExpanded(enr.id)}
                  className="w-full p-6 text-left hover:bg-black/5 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="p-3 rounded-xl bg-gradient-to-br from-indigo-100 to-purple-100">
                          <Book size={24} className="text-indigo-600" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-black text-gray-900">{subject.name}</h3>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <p className="text-sm font-bold text-indigo-600 font-mono">{subject.code}</p>
                            <span className="text-xs bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full">
                              {subject.year}° año
                            </span>
                            {subject.division && (
                              <span className="text-xs bg-blue-200 text-blue-700 px-2 py-0.5 rounded-full">
                                Div. {subject.division}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {isExpanded ? (
                      <ChevronUp className="text-indigo-600" size={28} />
                    ) : (
                      <ChevronDown className="text-gray-400" size={28} />
                    )}
                  </div>

                  {/* Quick Stats */}
                  <div className="grid grid-cols-3 gap-3">
                    {/* Parcial */}
                    <div className="p-4 rounded-2xl bg-white/60 border-2 border-blue-200 hover:border-blue-400 transition-colors">
                      <p className="text-xs text-blue-600 font-black mb-2 uppercase tracking-wide">PARCIAL</p>
                      <div className="flex items-center justify-between">
                        <p className="text-3xl font-black text-blue-900">{partialGrade ? partialGrade.toFixed(1) : '—'}</p>
                        {partialGrade && partialGrade >= 6 && (
                          <CheckCircle2 size={24} className="text-emerald-600" />
                        )}
                      </div>
                    </div>

                    {/* Final */}
                    <div className={`p-4 rounded-2xl bg-white/60 border-2 transition-colors ${
                      finalGrade && finalGrade >= 8 ? 'border-purple-400 hover:border-purple-600' :
                      finalGrade && finalGrade >= 6 ? 'border-emerald-400 hover:border-emerald-600' :
                      finalGrade ? 'border-red-400 hover:border-red-600' :
                      'border-gray-300 hover:border-gray-500'
                    }`}>
                      <p className={`text-xs font-black mb-2 uppercase tracking-wide ${
                        finalGrade && finalGrade >= 8 ? 'text-purple-600' :
                        finalGrade && finalGrade >= 6 ? 'text-emerald-600' :
                        finalGrade ? 'text-red-600' :
                        'text-gray-600'
                      }`}>FINAL</p>
                      <p className={`text-3xl font-black ${
                        finalGrade && finalGrade >= 8 ? 'text-purple-900' :
                        finalGrade && finalGrade >= 6 ? 'text-emerald-900' :
                        finalGrade ? 'text-red-900' :
                        'text-gray-600'
                      }`}>{finalGrade ? finalGrade.toFixed(1) : '—'}</p>
                    </div>

                    {/* Asistencia */}
                    <div className={`p-4 rounded-2xl bg-white/60 border-2 transition-colors ${
                      attendance && attendance >= 60 ? 'border-green-400 hover:border-green-600' :
                      'border-orange-400 hover:border-orange-600'
                    }`}>
                      <p className={`text-xs font-black mb-2 uppercase tracking-wide ${
                        attendance && attendance >= 60 ? 'text-green-600' :
                        'text-orange-600'
                      }`}>ASIST.</p>
                      <p className={`text-3xl font-black ${
                        attendance && attendance >= 60 ? 'text-green-900' :
                        'text-orange-900'
                      }`}>{attendance ? `${Math.round(attendance)}%` : '—'}</p>
                    </div>
                  </div>
                </button>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="border-t-2 border-gray-200 p-6 space-y-6 bg-white/50 backdrop-blur-sm">
                    {/* Profesor */}
                    <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/60 border-2 border-gray-100">
                      <div className="p-3 rounded-xl bg-gradient-to-br from-orange-100 to-yellow-100">
                        <User size={20} className="text-orange-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-gray-600 font-bold uppercase">Profesor</p>
                        <p className="text-lg font-bold text-gray-900">{professor?.name || '—'}</p>
                      </div>
                    </div>

                    {/* Notas Cargadas */}
                    {partialGrades.length > 0 && (
                      <div>
                        <h4 className="text-sm font-black text-gray-900 mb-3 flex items-center gap-2">
                          <BarChart3 size={18} className="text-indigo-600" />
                          NOTAS PARCIALES CARGADAS
                        </h4>
                        <div className="grid grid-cols-3 gap-2">
                          {partialGrades.map((grade, idx) => (
                            <div key={idx} className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-3 border-2 border-blue-200 text-center">
                              <p className="text-xs text-blue-600 font-black mb-1 uppercase">Nota {idx + 1}</p>
                              <p className="text-2xl font-black text-blue-900">{grade.toFixed(1)}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Info General */}
                    <div className="border-t-2 border-gray-200 pt-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-3 rounded-xl bg-white/60 border-2 border-gray-100">
                          <p className="text-xs text-gray-600 font-bold uppercase">Créditos</p>
                          <p className="text-2xl font-black text-gray-900">{subject.credits || '—'}</p>
                        </div>
                        <div className="p-3 rounded-xl bg-white/60 border-2 border-gray-100">
                          <p className="text-xs text-gray-600 font-bold uppercase">Promoción</p>
                          <p className="text-lg font-black text-gray-900">
                            {subject.allows_promotion ? '✓ Sí' : '✗ No'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Estado */}
                    <div className={`rounded-2xl p-6 border-2 ${
                      finalGrade && finalGrade >= 8 && subject.allows_promotion 
                        ? 'bg-gradient-to-r from-purple-100 to-pink-100 border-purple-400' :
                      finalGrade && finalGrade >= 6
                        ? 'bg-gradient-to-r from-emerald-100 to-teal-100 border-emerald-400' :
                      finalGrade
                        ? 'bg-gradient-to-r from-red-100 to-rose-100 border-red-400' :
                      partialStatus === 'regular'
                        ? 'bg-gradient-to-r from-yellow-100 to-amber-100 border-yellow-400' :
                      partialStatus === 'promocionado'
                        ? 'bg-gradient-to-r from-green-100 to-emerald-100 border-green-400' :
                      partialStatus === 'desaprobado'
                        ? 'bg-gradient-to-r from-red-100 to-rose-100 border-red-400' :
                        'bg-gradient-to-r from-blue-100 to-indigo-100 border-blue-400'
                    }`}>
                      <p className={`text-xs font-black mb-3 uppercase tracking-wide ${
                        finalGrade && finalGrade >= 8 && subject.allows_promotion 
                          ? 'text-purple-700' :
                        finalGrade && finalGrade >= 6
                          ? 'text-emerald-700' :
                        finalGrade
                          ? 'text-red-700' :
                        partialStatus === 'regular'
                          ? 'text-yellow-700' :
                        partialStatus === 'promocionado'
                          ? 'text-green-700' :
                        partialStatus === 'desaprobado'
                          ? 'text-red-700' :
                          'text-blue-700'
                      }`}>ESTADO ACTUAL</p>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-black text-gray-900">
                            {displayStatus === 'promocionado' ? 'PROMOCIONADO' :
                             displayStatus === 'aprobado' ? 'APROBADO' :
                             displayStatus === 'desaprobado' ? 'DESAPROBADO' :
                             displayStatus === 'regular' ? 'REGULAR' :
                             'EN CURSO'}
                          </p>
                          {partialGrade && !finalGrade && (
                            <p className="text-xs text-gray-600 mt-1">Parcial: {partialGrade.toFixed(1)} - Pendiente final</p>
                          )}
                        </div>
                        <div className="text-right">
                          {finalGrade && finalGrade >= 8 && subject.allows_promotion ? (
                            <div className="flex items-center gap-1 text-purple-700">
                              <Award size={28} />
                            </div>
                          ) : finalGrade && finalGrade >= 6 ? (
                            <div className="flex items-center gap-1 text-emerald-700">
                              <CheckCircle2 size={28} />
                            </div>
                          ) : finalGrade ? (
                            <div className="flex items-center gap-1 text-red-700">
                              <AlertCircle size={28} />
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 text-blue-700">
                              <Zap size={28} />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Footer Info */}
      {enrollments.length > 0 && (
        <div className="bg-gradient-to-r from-indigo-100 via-purple-100 to-pink-100 rounded-3xl p-8 border-2 border-indigo-300">
          <h3 className="text-2xl font-black text-gray-900 mb-6 flex items-center gap-2">
            <BarChart3 size={24} className="text-indigo-600" />
            Cómo interpretar tus calificaciones
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white/70 rounded-xl p-4">
              <p className="font-black text-blue-900 mb-2">📚 Nota Parcial</p>
              <p className="text-sm text-gray-700">Promedio de todas las notas cargadas. Mínimo <strong>6 puntos</strong> para examen final.</p>
            </div>
            <div className="bg-white/70 rounded-xl p-4">
              <p className="font-black text-indigo-900 mb-2">📊 Nota Final</p>
              <p className="text-sm text-gray-700"><strong>≥8</strong> Promocionado • <strong>6-7</strong> Aprobado • <strong>&lt;6</strong> Desaprobado</p>
            </div>
            <div className="bg-white/70 rounded-xl p-4">
              <p className="font-black text-cyan-900 mb-2">✓ Asistencia</p>
              <p className="text-sm text-gray-700">Mínimo <strong>60%</strong> para poder rendir examen final.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
