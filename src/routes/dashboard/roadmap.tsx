import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Lock, CheckCircle2, BookOpen, AlertCircle, RefreshCw, Zap, Award } from 'lucide-react'

type SubjectRow = {
  id: string
  name: string
  code: string
  year: number
  division?: string | null
  dictation_type: string
  semester: number
  correlatives_ok: boolean
  state: 'done' | 'current' | 'locked' | 'available' | 'recursant'
  isRecursant: boolean
  blockedByCorrelatives: Array<{ id: string; name: string; code: string }>
  // Nuevos campos para notas
  finalGrade?: number
  partialGrade?: number
  gradeStatus?: string
  allowsPromotion?: boolean
}

export const Route = createFileRoute('/dashboard/roadmap')({
  component: RoadmapPage,
})

function RoadmapPage() {
  const [loading, setLoading] = useState(true)
  const [programName, setProgramName] = useState('')
  const [subjects, setSubjects] = useState<SubjectRow[]>([])
  const [subjectsMap, setSubjectsMap] = useState<Map<string, any>>(new Map())
  const [studentId, setStudentId] = useState<string>('')

  useEffect(() => {
    void load()
  }, [])

  async function load() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setLoading(false)
      return
    }

    const { data: student } = await supabase
      .from('students')
      .select('id, year, program_id, program:programs(name)')
      .eq('user_id', user.id)
      .single()

    if (!student) {
      setLoading(false)
      return
    }

    setStudentId((student as any).id)
    setProgramName((student as any).program?.name ?? '')

    const programId = (student as any).program_id as string | undefined
    const studentYear = (student as any).year as number

    let catalog: any[] = []
    if (programId) {
      const { data: subs } = await supabase
        .from('subjects')
        .select('id, name, code, year, division, dictation_type, semester, allows_promotion')
        .eq('program_id', programId)
        .order('year')
        .order('code')
      catalog = subs ?? []
    }

    const sMap = new Map()
    for (const s of catalog) {
      sMap.set(s.id, s)
    }
    setSubjectsMap(sMap)

    const { data: enrollments } = await supabase
      .from('enrollments')
      .select('id, subject_id, division, academic_year, status')
      .eq('student_id', (student as any).id)

    const enrolledIds = new Set<string>()
    const passedIds = new Set<string>()
    const recursantIds = new Set<string>()
    const gradesMap = new Map<string, any>()
    let enrolledDivision: string | null = null

    if (enrollments && enrollments.length > 0) {
      for (const enr of enrollments) {
        const { data: grades } = await supabase
          .from('grades')
          .select('status, final_grade, partial_grade')
          .eq('enrollment_id', enr.id)
          .single()

        if (grades) {
          gradesMap.set(enr.subject_id, grades)
        }

        if (grades && ['promoted', 'passed', 'regular'].includes(grades.status)) {
          passedIds.add(enr.subject_id)
        } else {
          recursantIds.add(enr.subject_id)
          enrolledIds.add(enr.subject_id)
        }
        
        // Detectar si está inscripto en una división de primer año
        const subj = sMap.get(enr.subject_id)
        if (subj?.year === 1 && (enr as any).division) {
          enrolledDivision = (enr as any).division
        }
      }
    }

    const { data: corrs } = await supabase
      .from('subject_correlatives')
      .select('subject_id, requires_subject_id')

    const requiresMap = new Map<string, string[]>()
    for (const c of corrs ?? []) {
      const arr = requiresMap.get(c.subject_id) ?? []
      arr.push(c.requires_subject_id)
      requiresMap.set(c.subject_id, arr)
    }

    const computed: SubjectRow[] = (catalog as any[])
      .filter(s => {
        // Filtrar divisiones: si está inscripto en una división de primer año,
        // ocultar materias de primer año de la otra división
        if (s.year === 1 && s.division && enrolledDivision && enrolledDivision !== s.division) {
          return false
        }
        return true
      })
      .map((s) => {
      const reqs = requiresMap.get(s.id) ?? []
      const correlatives_ok =
        reqs.length === 0 || reqs.every((rid) => passedIds.has(rid))

      const blockedByCorrelatives = reqs
        .filter((rid) => !passedIds.has(rid))
        .map((rid) => sMap.get(rid))
        .filter((s) => s)

      let state: SubjectRow['state'] = 'locked'
      const isRecursant = recursantIds.has(s.id)
      
      if (passedIds.has(s.id)) {
        state = 'done'
      } else if (isRecursant) {
        state = 'recursant'
      } else if (enrolledIds.has(s.id)) {
        state = 'current'
      } else if (correlatives_ok && s.year <= studentYear + 1) {
        state = 'available'
      } else {
        state = 'locked'
      }

      const grades = gradesMap.get(s.id)

      return {
        id: s.id,
        name: s.name,
        code: s.code,
        year: s.year,
        division: s.division,
        dictation_type: s.dictation_type || 'anual',
        semester: s.semester || 1,
        correlatives_ok,
        state,
        isRecursant,
        blockedByCorrelatives,
        finalGrade: grades?.final_grade,
        partialGrade: grades?.partial_grade,
        gradeStatus: grades?.status,
        allowsPromotion: s.allows_promotion,
      }
    })

    setSubjects(computed)
    setLoading(false)
  }

  const getDictationLabel = (subject: SubjectRow) => {
    if (subject.dictation_type === 'cuatrimestral') {
      return `${subject.semester === 1 ? '1er' : '2do'} C.`
    }
    return 'Anual'
  }

  function getGradeColor(finalGrade?: number, allowsPromotion?: boolean) {
    if (!finalGrade) return 'from-gray-100 to-gray-200'
    
    // Si permite promoción y nota >= 7, mostrar como promocionado
    if (allowsPromotion && finalGrade >= 7) return 'from-purple-100 to-purple-200'
    // Si nota >= 7 pero no permite promoción, mostrar como aprobado
    if (finalGrade >= 7) return 'from-emerald-100 to-emerald-200'
    // Si nota entre 4-6, mostrar como aprobado
    if (finalGrade >= 4) return 'from-emerald-100 to-emerald-200'
    // Si nota < 4, desaprobado
    return 'from-red-100 to-red-200'
  }

  function getStatusLabel(finalGrade?: number, allowsPromotion?: boolean, gradeStatus?: string) {
    if (!finalGrade) return null
    
    // Lógica: promocionado solo si allows_promotion = true Y nota >= 8
    if (allowsPromotion && finalGrade >= 8) return 'Promocionado'
    if (finalGrade >= 6) return 'Aprobado'
    return 'Desaprobado'
  }

  function getStatusColor(finalGrade?: number, allowsPromotion?: boolean) {
    if (!finalGrade) return 'text-gray-600'
    
    if (allowsPromotion && finalGrade >= 8) return 'text-purple-700'
    if (finalGrade >= 8) return 'text-emerald-700'
    if (finalGrade >= 6) return 'text-emerald-700'
    return 'text-red-700'
  }

  const byYear = useMemo(() => {
    const m = new Map<number, SubjectRow[]>()
    for (const s of subjects) {
      const arr = m.get(s.year) ?? []
      arr.push(s)
      m.set(s.year, arr)
    }
    return [...m.entries()].sort((a, b) => a[0] - b[0])
  }, [subjects])

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Plan de Estudios
          </h1>
          <p className="text-gray-500 mt-2">Cargando tu plan académico...</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="card p-4 animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-3/4 mb-3"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
              <div className="h-12 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent mb-3">
          Plan de Estudios
        </h1>
        {programName && (
          <p className="text-gray-600 text-lg">
            Carrera: <span className="font-bold text-gray-900">{programName}</span>
          </p>
        )}
        <div className="mt-4 flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={18} className="text-emerald-600" />
            <span className="text-gray-700">Aprobado</span>
          </div>
          <div className="flex items-center gap-2">
            <Award size={18} className="text-purple-600" />
            <span className="text-gray-700">Promocionado</span>
          </div>
          <div className="flex items-center gap-2">
            <BookOpen size={18} className="text-blue-600" />
            <span className="text-gray-700">En curso</span>
          </div>
          <div className="flex items-center gap-2">
            <Zap size={18} className="text-amber-600" />
            <span className="text-gray-700">Disponible</span>
          </div>
          <div className="flex items-center gap-2">
            <Lock size={18} className="text-gray-400" />
            <span className="text-gray-700">Bloqueado</span>
          </div>
          <div className="flex items-center gap-2">
            <RefreshCw size={18} className="text-orange-600" />
            <span className="text-gray-700">Recursante</span>
          </div>
        </div>
      </div>

      {/* Materias por año */}
      {byYear.map(([year, list]) => (
        <section key={year} className="space-y-4">
          <h2 className="text-2xl font-bold text-gray-900 border-b-4 border-indigo-600 pb-2 inline-block">
            Año {year}
          </h2>
          
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {list.map((s) => {
              const statusLabel = getStatusLabel(s.finalGrade, s.allowsPromotion, s.gradeStatus)
              const statusColor = getStatusColor(s.finalGrade, s.allowsPromotion)
              
              return (
                <div
                  key={s.id}
                  className={`card rounded-xl overflow-hidden border-l-4 transition-all hover:shadow-lg ${
                    s.state === 'done'
                      ? 'border-l-emerald-600 bg-gradient-to-br from-emerald-50 to-teal-50'
                      : s.state === 'recursant'
                        ? 'border-l-orange-600 bg-gradient-to-br from-orange-50 to-amber-50'
                        : s.state === 'current'
                          ? 'border-l-blue-600 bg-gradient-to-br from-blue-50 to-cyan-50'
                          : s.state === 'available'
                            ? 'border-l-amber-500 bg-gradient-to-br from-amber-50 to-yellow-50'
                            : 'border-l-gray-300 bg-gradient-to-br from-gray-50 to-slate-50'
                  }`}
                >
                  {/* Header con código y tipo */}
                  <div className="p-4 border-b border-gray-200">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        {s.state === 'done' && <CheckCircle2 className="h-5 w-5 text-emerald-700" />}
                        {s.state === 'recursant' && <RefreshCw className="h-5 w-5 text-orange-700" />}
                        {s.state === 'current' && <BookOpen className="h-5 w-5 text-blue-700" />}
                        {s.state === 'available' && <Zap className="h-5 w-5 text-amber-700" />}
                        {s.state === 'locked' && <Lock className="h-5 w-5 text-gray-400" />}
                        
                        <span className="font-mono text-sm font-bold text-gray-600">{s.code}</span>
                      </div>
                      <div className="flex gap-2">
                        <span className="text-xs font-bold px-2 py-1 rounded-full bg-gray-200 text-gray-700">
                          {getDictationLabel(s)}
                        </span>
                        {s.allowsPromotion && (
                          <span className="text-xs font-bold px-2 py-1 rounded-full bg-purple-200 text-purple-700" title="Permite promoción con nota ≥8">
                            🎓 Promocional
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <h3 className="font-bold text-gray-900 text-sm leading-tight">{s.name}</h3>
                      {s.division && (
                        <span className="text-xs bg-blue-200 text-blue-700 px-2 py-0.5 rounded inline-block">
                          Div. {s.division}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Estado */}
                  <div className="px-4 py-3 bg-white/50">
                    <p className="text-xs text-gray-600 font-semibold mb-1">ESTADO</p>
                    <p className="text-sm font-bold text-gray-900">
                      {s.state === 'done' && '✓ Aprobada'}
                      {s.state === 'recursant' && '↻ Recursante'}
                      {s.state === 'current' && '● En curso'}
                      {s.state === 'available' && '⚡ Disponible'}
                      {s.state === 'locked' && '🔒 Bloqueada'}
                    </p>
                  </div>

                  {/* Notas si tiene */}
                  {(s.finalGrade !== undefined || s.partialGrade !== undefined) && (
                    <div className="px-4 py-3 border-t border-gray-200 space-y-2">
                      <p className="text-xs text-gray-600 font-semibold">CALIFICACIÓN</p>
                      <div className="grid grid-cols-2 gap-2">
                        {s.partialGrade !== undefined && (
                          <div className="bg-white rounded p-2 text-center border border-blue-200">
                            <p className="text-xs text-blue-600 font-semibold">Parcial</p>
                            <p className="text-lg font-bold text-blue-900">{s.partialGrade}</p>
                          </div>
                        )}
                        {s.finalGrade !== undefined && (
                          <div className={`bg-gradient-to-br ${getGradeColor(s.finalGrade, s.allowsPromotion)} rounded p-2 text-center border`}>
                            <p className="text-xs font-semibold" style={{color: s.finalGrade >= 7 ? '#047857' : s.finalGrade >= 4 ? '#047857' : '#dc2626'}}>
                              Final
                            </p>
                            <p className="text-lg font-bold" style={{color: s.finalGrade >= 7 ? '#065f46' : s.finalGrade >= 4 ? '#065f46' : '#7f1d1d'}}>
                              {s.finalGrade}
                            </p>
                          </div>
                        )}
                      </div>
                      
                      {/* Status según condición */}
                      {statusLabel && (
                        <div className={`mt-2 p-2 rounded text-center text-xs font-bold ${statusColor}`}>
                          {s.allowsPromotion && s.finalGrade >= 8 && (
                            <div className="flex items-center justify-center gap-1">
                              <Award size={14} />
                              Promocionado
                            </div>
                          )}
                          {((!s.allowsPromotion && s.finalGrade >= 8) || (s.finalGrade >= 6 && s.finalGrade < 8)) && (
                            <div>Aprobado</div>
                          )}
                          {s.finalGrade < 6 && (
                            <div>Desaprobado</div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Correlativas bloqueando */}
                  {s.blockedByCorrelatives.length > 0 && (
                    <div className="px-4 py-3 border-t border-gray-200 bg-yellow-50">
                      <div className="flex items-center gap-1 text-xs font-bold text-amber-700 mb-2">
                        <AlertCircle className="h-3.5 w-3.5" />
                        Requiere:
                      </div>
                      <div className="space-y-1">
                        {s.blockedByCorrelatives.map((corr) => (
                          <div key={corr.id} className="text-xs text-amber-900">
                            <span className="font-mono font-bold">{corr.code}</span> {corr.name}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </section>
      ))}

      {subjects.length === 0 && (
        <div className="card p-12 text-center rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100">
          <BookOpen size={48} className="mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600 text-lg">No hay materias catalogadas para tu programa.</p>
        </div>
      )}

      {/* Leyenda final */}
      <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 rounded-2xl p-6 border border-blue-200">
        <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
          <AlertCircle size={20} className="text-blue-600" />
          Cómo interpretar tu plan de estudios
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
          <div>
            <p className="font-semibold text-blue-900 mb-2">📌 Estados</p>
            <ul className="space-y-1 text-gray-700">
              <li><strong>Aprobada:</strong> Ya cursaste y aprobaste</li>
              <li><strong>Promocionado:</strong> Nota ≥8 en materia que permite promoción</li>
              <li><strong>En curso:</strong> Actualmente inscripto</li>
              <li><strong>Disponible:</strong> Podés inscribirte</li>
              <li><strong>Bloqueada:</strong> Falta correlativa o no es tu año</li>
              <li><strong>Recursante:</strong> Cursaste pero no aprobaste</li>
            </ul>
          </div>
          <div>
            <p className="font-semibold text-indigo-900 mb-2">📊 Calificaciones</p>
            <ul className="space-y-1 text-gray-700">
              <li><strong>Parcial:</strong> Promedio de trabajos y parciales</li>
              <li><strong>Final:</strong> Nota del examen final</li>
              <li><strong>Promocionado:</strong> Solo si ≥8 Y materia lo permite (badge 🎓)</li>
              <li><strong>Aprobado:</strong> Nota entre 6-7 ó ≥8 sin promoción</li>
              <li><strong>Desaprobado:</strong> Nota menor a 6</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
