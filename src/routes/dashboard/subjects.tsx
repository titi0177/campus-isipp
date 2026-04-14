import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { StatusBadge } from '@/components/StatusBadge'
import { ChevronDown, ChevronUp, Book, User, BarChart3, CheckCircle2, AlertCircle } from 'lucide-react'

export const Route = createFileRoute('/dashboard/subjects')({
  component: SubjectsPage,
})

function SubjectsPage() {
  const [enrollments, setEnrollments] = useState<any[]>([])
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

      const { data, error: queryError } = await supabase
        .from('enrollments')
        .select(`
          id,
          student_id,
          subject_id,
          academic_year,
          attempt,
          status,
          subject:subjects(
            id,
            name,
            code,
            credits,
            allows_promotion,
            professor_id
          ),
          grades(
            id, 
            enrollment_id, 
            partial_1, partial_2, partial_3,
            practical_1, practical_2, practical_3,
            partial_grade,
            final_grade_exam, 
            final_grade, 
            status
          ),
          attendance(id, enrollment_id, percentage)
        `)
        .eq('student_id', student.id)
        .order('academic_year', { ascending: false })

      if (queryError) {
        console.error('Query error:', queryError)
        setError(`Error: ${queryError.message}`)
        setLoading(false)
        return
      }

      const enrollmentsWithProfs: any[] = []
      
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
          enrollmentsWithProfs.push({
            ...enrollment,
            professor: prof || null
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

  function getGradeColor(grade: number | null | undefined) {
    if (grade === null || grade === undefined) return 'from-gray-400 to-gray-500'
    if (grade >= 7) return 'from-emerald-400 to-emerald-600'
    if (grade >= 4) return 'from-amber-400 to-amber-600'
    return 'from-red-400 to-red-600'
  }

  function getAttendanceColor(percentage: number | null | undefined) {
    if (percentage === null || percentage === undefined) return 'from-gray-100 to-gray-200'
    if (percentage >= 60) return 'from-emerald-100 to-emerald-200'
    return 'from-red-100 to-red-200'
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Mis Materias
          </h1>
          <p className="text-gray-500 mt-2">Cargando tu información académica...</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="card p-6 animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-6"></div>
              <div className="grid grid-cols-2 gap-4">
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
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent mb-3">
          Mis Materias
        </h1>
        <p className="text-gray-600 text-lg">Seguimiento de tu progreso académico</p>
        <div className="mt-4 flex gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
            <span className="text-sm text-gray-600">Aprobado</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-amber-500"></div>
            <span className="text-sm text-gray-600">En progreso</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <span className="text-sm text-gray-600">Desaprobado</span>
          </div>
        </div>
      </div>

      {error && (
        <div className="card p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
          <AlertCircle className="text-red-600" size={20} />
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {enrollments.length === 0 ? (
        <div className="card p-12 text-center rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100">
          <Book size={48} className="mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600 text-lg">No tienes materias inscriptas aún.</p>
          <p className="text-gray-500 text-sm mt-2">Dirígete a inscripciones para agregar tus materias.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {enrollments.map(enr => {
            const subject = enr.subject
            const professor = enr.professor
            const grade = Array.isArray(enr.grades) ? enr.grades[0] : enr.grades
            const att = Array.isArray(enr.attendance) ? enr.attendance[0] : enr.attendance

            let displayStatus = grade?.status || 'in_progress'
            if (grade?.status === 'promoted' && !subject?.allows_promotion) {
              displayStatus = 'passed'
            }

            const isExpanded = expandedId === enr.id

            const partials = [grade?.partial_1, grade?.partial_2, grade?.partial_3].filter(p => p != null)
            const practicals = [grade?.practical_1, grade?.practical_2, grade?.practical_3].filter(p => p != null)
            const allGrades = [...partials, ...practicals]
            const calculatedPartial = allGrades.length > 0 
              ? (allGrades.reduce((a, b) => a + b, 0) / allGrades.length).toFixed(2)
              : null
            const partialToShow = grade?.partial_grade || calculatedPartial

            const finalGrade = grade?.final_grade
            const attendance = att?.percentage

            return (
              <div
                key={enr.id}
                className={`card overflow-hidden rounded-2xl transition-all duration-300 transform hover:shadow-xl ${
                  isExpanded ? 'ring-2 ring-blue-400' : ''
                }`}
              >
                {/* Header - Click para expandir */}
                <button
                  onClick={() => toggleExpanded(enr.id)}
                  className="w-full p-6 text-left hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 rounded-lg bg-gradient-to-br from-blue-100 to-indigo-100">
                          <Book size={20} className="text-indigo-600" />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-gray-900">{subject?.name}</h3>
                          <p className="text-sm text-gray-500">{subject?.code} • {professor?.name}</p>
                        </div>
                      </div>
                    </div>

                    {isExpanded ? (
                      <ChevronUp className="text-blue-600" size={24} />
                    ) : (
                      <ChevronDown className="text-gray-400" size={24} />
                    )}
                  </div>

                  {/* Quick Stats - Visible siempre */}
                  <div className="grid grid-cols-3 gap-3 mt-4">
                    {/* Parcial */}
                    <div className="p-3 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200">
                      <p className="text-xs text-blue-600 font-semibold mb-1">PARCIAL</p>
                      <div className="flex items-center justify-between">
                        <p className="text-2xl font-bold text-blue-900">{partialToShow ?? '—'}</p>
                        {partialToShow && parseFloat(partialToShow as string) >= 6 && (
                          <CheckCircle2 size={20} className="text-emerald-600" />
                        )}
                      </div>
                    </div>

                    {/* Final */}
                    <div className={`p-3 rounded-xl bg-gradient-to-br ${
                      finalGrade && finalGrade >= 7
                        ? 'from-emerald-50 to-emerald-100 border border-emerald-200'
                        : finalGrade && finalGrade >= 4
                          ? 'from-amber-50 to-amber-100 border border-amber-200'
                          : 'from-gray-50 to-gray-100 border border-gray-200'
                    }`}>
                      <p className={`text-xs font-semibold mb-1 ${
                        finalGrade && finalGrade >= 7
                          ? 'text-emerald-600'
                          : finalGrade && finalGrade >= 4
                            ? 'text-amber-600'
                            : 'text-gray-600'
                      }`}>FINAL</p>
                      <p className={`text-2xl font-bold ${
                        finalGrade && finalGrade >= 7
                          ? 'text-emerald-900'
                          : finalGrade && finalGrade >= 4
                            ? 'text-amber-900'
                            : 'text-gray-600'
                      }`}>{finalGrade ?? '—'}</p>
                    </div>

                    {/* Asistencia */}
                    <div className={`p-3 rounded-xl bg-gradient-to-br ${
                      attendance && attendance >= 60
                        ? 'from-emerald-50 to-emerald-100 border border-emerald-200'
                        : 'from-red-50 to-red-100 border border-red-200'
                    }`}>
                      <p className={`text-xs font-semibold mb-1 ${
                        attendance && attendance >= 60
                          ? 'text-emerald-600'
                          : 'text-red-600'
                      }`}>ASISTENCIA</p>
                      <p className={`text-2xl font-bold ${
                        attendance && attendance >= 60
                          ? 'text-emerald-900'
                          : 'text-red-900'
                      }`}>{attendance ?? '—'}%</p>
                    </div>
                  </div>
                </button>

                {/* Detalles expandido */}
                {isExpanded && (
                  <div className="border-t border-gray-200 p-6 space-y-6 bg-gradient-to-b from-gray-50 to-white">
                    {/* Parciales y Trabajos Prácticos */}
                    {(partials.length > 0 || practicals.length > 0) && (
                      <div>
                        <h4 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                          <BarChart3 size={18} className="text-indigo-600" />
                          Desglose de Calificaciones
                        </h4>
                        <div className="grid grid-cols-3 gap-2">
                          {[1, 2, 3].map(i => {
                            const pValue = grade?.[`partial_${i}`]
                            return (
                              <div key={`p${i}`} className="bg-white rounded-lg p-3 border border-gray-200 text-center hover:border-indigo-300 transition-colors">
                                <p className="text-xs text-gray-500 font-semibold mb-1">P{i}</p>
                                <p className="text-xl font-bold text-gray-900">{pValue ?? '—'}</p>
                              </div>
                            )
                          })}
                          {[1, 2, 3].map(i => {
                            const tpValue = grade?.[`practical_${i}`]
                            return (
                              <div key={`tp${i}`} className="bg-white rounded-lg p-3 border border-gray-200 text-center hover:border-indigo-300 transition-colors">
                                <p className="text-xs text-gray-500 font-semibold mb-1">TP{i}</p>
                                <p className="text-xl font-bold text-gray-900">{tpValue ?? '—'}</p>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}

                    {/* Información General */}
                    <div className="border-t border-gray-200 pt-4">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center gap-3">
                          <User size={16} className="text-gray-400" />
                          <div>
                            <p className="text-gray-500 text-xs">Profesor</p>
                            <p className="text-gray-900 font-semibold">{professor?.name || '—'}</p>
                          </div>
                        </div>
                        <div>
                          <p className="text-gray-500 text-xs">Año Académico</p>
                          <p className="text-gray-900 font-semibold">{enr.academic_year}°</p>
                        </div>
                        <div>
                          <p className="text-gray-500 text-xs">Créditos</p>
                          <p className="text-gray-900 font-semibold">{subject?.credits || '—'}</p>
                        </div>
                        <div>
                          <p className="text-gray-500 text-xs">Intento</p>
                          <p className="text-gray-900 font-semibold">{enr.attempt || 1}</p>
                        </div>
                      </div>
                    </div>

                    {/* Estado Final */}
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200">
                      <p className="text-xs text-blue-600 font-bold mb-2">ESTADO FINAL</p>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600">Condición académica</p>
                          <StatusBadge status={displayStatus} />
                        </div>
                        <div className="text-right">
                          {finalGrade && finalGrade >= 7 ? (
                            <div className="text-emerald-600">
                              <CheckCircle2 size={32} />
                              <p className="text-xs font-semibold mt-1">PROMOCIONADO</p>
                            </div>
                          ) : finalGrade && finalGrade >= 4 ? (
                            <div className="text-amber-600">
                              <CheckCircle2 size={32} />
                              <p className="text-xs font-semibold mt-1">APROBADO</p>
                            </div>
                          ) : finalGrade ? (
                            <div className="text-red-600">
                              <AlertCircle size={32} />
                              <p className="text-xs font-semibold mt-1">DESAPROBADO</p>
                            </div>
                          ) : (
                            <div className="text-gray-600">
                              <div className="h-8 w-8 rounded-full border-2 border-gray-400 flex items-center justify-center text-xs font-bold">?</div>
                              <p className="text-xs font-semibold mt-1">PENDIENTE</p>
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
        <div className="bg-gradient-to-r from-indigo-50 via-blue-50 to-cyan-50 rounded-2xl p-6 border border-blue-200">
          <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <BarChart3 size={20} className="text-indigo-600" />
            Cómo interpretar tus calificaciones
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="font-semibold text-blue-900 mb-2">📚 Nota Parcial</p>
              <p className="text-sm text-gray-700">Promedio de tus parciales y trabajos prácticos. Necesitas mínimo <strong>6 puntos</strong> para habilitar el examen final.</p>
            </div>
            <div>
              <p className="font-semibold text-indigo-900 mb-2">📊 Nota Final</p>
              <p className="text-sm text-gray-700"><strong>≥7</strong> Promocionado • <strong>4-6</strong> Aprobado • <strong>&lt;4</strong> Desaprobado</p>
            </div>
            <div>
              <p className="font-semibold text-cyan-900 mb-2">✓ Asistencia</p>
              <p className="text-sm text-gray-700">Porcentaje acumulado de Abril a Diciembre. Necesitas mínimo <strong>60%</strong> para poder rendir examen.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
