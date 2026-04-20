import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Lock, CheckCircle2, BookOpen, AlertCircle, RefreshCw, Zap, Award, TrendingUp } from 'lucide-react'
 
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
  attempt: number
  blockedByCorrelatives: Array<{ id: string; name: string; code: string }>
  finalGrade?: number
  partialGrade?: number
  partialStatus?: string
  finalStatus?: string
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
    try {
      setLoading(true)

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return setLoading(false)

      const { data: student } = await supabase
        .from('students')
        .select('id, year, program_id, program:programs(name)')
        .eq('user_id', user.id)
        .single()

      if (!student) return setLoading(false)

      setStudentId(student.id)
      setProgramName(student.program?.name ?? '')

      const studentYear = student.year
      const programId = student.program_id

      const [
        { data: catalog },
        { data: enrollments },
        { data: corrs }
      ] = await Promise.all([
        supabase
          .from('subjects')
          .select('id, name, code, year, division, dictation_type, semester, allows_promotion')
          .eq('program_id', programId)
          .order('year')
          .order('code'),

        supabase
          .from('enrollments')
          .select('id, subject_id, division, status, attempt')
          .eq('student_id', student.id),

        supabase
          .from('subject_correlatives')
          .select('subject_id, requires_subject_id')
      ])

      const sMap = new Map()
      for (const s of catalog || []) {
        sMap.set(s.id, s)
      }
      setSubjectsMap(sMap)

      const enrollmentMap = new Map()
      const enrolledIds = new Set<string>()

      for (const e of enrollments || []) {
        enrollmentMap.set(e.subject_id, e)
        enrolledIds.add(e.subject_id)
      }

      const enrollmentIds = (enrollments || []).map(e => e.id)

      let gradesMap = new Map()

      if (enrollmentIds.length > 0) {
        const { data: gradesData } = await supabase
          .from('enrollment_grades')
          .select('enrollment_id, final_status, partial_status, final_grade, partial_grade')
          .in('enrollment_id', enrollmentIds)

        for (const g of gradesData || []) {
          gradesMap.set(g.enrollment_id, g)
        }
      }

      const requiresMap = new Map<string, string[]>()
      for (const c of corrs || []) {
        const arr = requiresMap.get(c.subject_id) ?? []
        arr.push(c.requires_subject_id)
        requiresMap.set(c.subject_id, arr)
      }

      const passedIds = new Set<string>()
      const recursantIds = new Set<string>()
      let enrolledDivision: string | null = null

      for (const enr of enrollments || []) {
  const grades = gradesMap.get(enr.id)

  if (
    grades?.final_status === 'aprobado' ||
    grades?.final_status === 'promocionado'
  ) {
    passedIds.add(enr.subject_id)
  } else if (
    grades?.final_status === 'desaprobado'
  ) {
    recursantIds.add(enr.subject_id)
  }

        const subj = sMap.get(enr.subject_id)
        if (subj?.year === 1 && enr.division) {
          enrolledDivision = enr.division
        }
      }

      const computed: SubjectRow[] = (catalog || [])
        .filter(s => {
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
            .filter(Boolean)

          const enrollment = enrollmentMap.get(s.id)
          const grades = enrollment ? gradesMap.get(enrollment.id) : null

          const isRecursant = recursantIds.has(s.id)
          const attempt = enrollment?.attempt || 1

          let state: SubjectRow['state'] = 'locked'

          if (passedIds.has(s.id)) state = 'done'
          else if (isRecursant) state = 'recursant'
          else if (enrolledIds.has(s.id)) state = 'current'
          else if (correlatives_ok && s.year <= studentYear + 1) state = 'available'

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
            attempt,
            blockedByCorrelatives,
            finalGrade: grades?.final_grade,
            partialGrade: grades?.partial_grade,
            partialStatus: grades?.partial_status,
            finalStatus: grades?.final_status,
            allowsPromotion: s.allows_promotion,
          }
        })

      setSubjects(computed)

    } catch (err) {
      console.error('❌ Error cargando roadmap:', err)
    } finally {
      setLoading(false)
    }
  }

  // 🔽 TODO LO DEMÁS (TU UI ORIGINAL) SE MANTIENE IGUAL 🔽

  // 🔽 TODO LO DEMÁS (TU UI ORIGINAL) SE MANTIENE IGUAL 🔽
  

  const getDictationLabel = (subject: SubjectRow) => {
    if (subject.dictation_type === 'cuatrimestral') {
      return `${subject.semester === 1 ? '1er' : '2do'} C.`
    }
    return 'Anual'
  }

  function getStatusLabel(finalGrade?: number, allowsPromotion?: boolean) {
    if (!finalGrade) return null
    if (allowsPromotion && finalGrade >= 8) return 'Promocionado'
    if (finalGrade >= 6) return 'Aprobado'
    return 'Desaprobado'
  }

  function getStatusColor(finalGrade?: number, allowsPromotion?: boolean) {
    if (!finalGrade) return 'text-gray-600'
    if (allowsPromotion && finalGrade >= 8) return 'text-purple-700'
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

  const stats = useMemo(() => {
    const approved = subjects.filter(s => s.state === 'done').length
    const promoted = subjects.filter(s => s.state === 'done' && s.finalGrade && s.finalGrade >= 8 && s.allowsPromotion).length
    const current = subjects.filter(s => s.state === 'current').length
    const recursant = subjects.filter(s => s.state === 'recursant').length
    const available = subjects.filter(s => s.state === 'available').length
    return { approved, promoted, current, recursant, available, total: subjects.length }
  }, [subjects])

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-3xl p-8 text-white shadow-2xl animate-pulse">
          <div className="h-12 bg-white/20 rounded w-1/2 mb-4"></div>
          <div className="h-6 bg-white/10 rounded w-1/3"></div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="card p-4 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-3"></div>
              <div className="h-8 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header Hero */}
      <div className="relative bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-3xl p-8 text-white shadow-2xl overflow-hidden">
        <div className="absolute top-0 right-0 opacity-20">
          <TrendingUp size={120} />
        </div>
        <div className="relative z-10">
          <p className="text-blue-100 text-sm font-semibold mb-2">Bienvenido</p>
          <h1 className="text-5xl md:text-6xl font-black mb-2">Plan de Estudios</h1>
          {programName && (
            <p className="text-xl text-blue-100 font-medium">{programName}</p>
          )}
          <p className="text-blue-100 mt-4 max-w-2xl">Seguimiento completo de tu progreso académico. Visualiza tus materias, calificaciones y estado de cada asignatura.</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
        <div className="card p-4 border-l-4 border-l-emerald-600 bg-gradient-to-br from-emerald-50 to-teal-50 hover:shadow-lg transition-all cursor-pointer">
          <p className="text-xs text-emerald-600 font-bold mb-2">APROBADAS</p>
          <p className="text-3xl font-black text-emerald-700">{stats.approved}</p>
          <p className="text-xs text-emerald-600 mt-1">{stats.total > 0 ? Math.round((stats.approved / stats.total) * 100) : 0}%</p>
        </div>
        
        <div className="card p-4 border-l-4 border-l-purple-600 bg-gradient-to-br from-purple-50 to-pink-50 hover:shadow-lg transition-all cursor-pointer">
          <p className="text-xs text-purple-600 font-bold mb-2">PROMOCIONADAS</p>
          <p className="text-3xl font-black text-purple-700">{stats.promoted}</p>
          <p className="text-xs text-purple-600 mt-1">Nota ≥8</p>
        </div>
        
        <div className="card p-4 border-l-4 border-l-blue-600 bg-gradient-to-br from-blue-50 to-cyan-50 hover:shadow-lg transition-all cursor-pointer">
          <p className="text-xs text-blue-600 font-bold mb-2">EN CURSO</p>
          <p className="text-3xl font-black text-blue-700">{stats.current}</p>
          <p className="text-xs text-blue-600 mt-1">Inscripto</p>
        </div>

        <div className="card p-4 border-l-4 border-l-orange-600 bg-gradient-to-br from-orange-50 to-yellow-50 hover:shadow-lg transition-all cursor-pointer">
          <p className="text-xs text-orange-600 font-bold mb-2">RECURSANTES</p>
          <p className="text-3xl font-black text-orange-700">{stats.recursant}</p>
          <p className="text-xs text-orange-600 mt-1">Reintentando</p>
        </div>
        
        <div className="card p-4 border-l-4 border-l-indigo-600 bg-gradient-to-br from-indigo-50 to-indigo-100 hover:shadow-lg transition-all cursor-pointer">
          <p className="text-xs text-indigo-600 font-bold mb-2">TOTAL</p>
          <p className="text-3xl font-black text-indigo-700">{stats.total}</p>
          <p className="text-xs text-indigo-600 mt-1">Materias</p>
        </div>
      </div>

      {/* Legend Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
        <div className="card p-3 border-t-4 border-t-emerald-600 hover:shadow-md transition-all text-center">
          <CheckCircle2 size={24} className="text-emerald-600 mx-auto mb-2" />
          <p className="text-xs font-bold text-gray-900">APROBADO</p>
          <p className="text-xs text-gray-600 mt-1">Completado</p>
        </div>
        
        <div className="card p-3 border-t-4 border-t-purple-600 hover:shadow-md transition-all text-center">
          <Award size={24} className="text-purple-600 mx-auto mb-2" />
          <p className="text-xs font-bold text-gray-900">PROMOCIÓN</p>
          <p className="text-xs text-gray-600 mt-1">Nota ≥8</p>
        </div>
        
        <div className="card p-3 border-t-4 border-t-blue-600 hover:shadow-md transition-all text-center">
          <BookOpen size={24} className="text-blue-600 mx-auto mb-2" />
          <p className="text-xs font-bold text-gray-900">EN CURSO</p>
          <p className="text-xs text-gray-600 mt-1">Inscripto</p>
        </div>

        <div className="card p-3 border-t-4 border-t-orange-600 hover:shadow-md transition-all text-center">
          <RefreshCw size={24} className="text-orange-600 mx-auto mb-2" />
          <p className="text-xs font-bold text-gray-900">RECURSANTE</p>
          <p className="text-xs text-gray-600 mt-1">Reintentando</p>
        </div>
        
        <div className="card p-3 border-t-4 border-t-amber-500 hover:shadow-md transition-all text-center">
          <Zap size={24} className="text-amber-600 mx-auto mb-2" />
          <p className="text-xs font-bold text-gray-900">DISPONIBLE</p>
          <p className="text-xs text-gray-600 mt-1">Podés inscribir</p>
        </div>
        
        <div className="card p-3 border-t-4 border-t-gray-400 hover:shadow-md transition-all text-center">
          <Lock size={24} className="text-gray-500 mx-auto mb-2" />
          <p className="text-xs font-bold text-gray-900">BLOQUEADO</p>
          <p className="text-xs text-gray-600 mt-1">Sin requisitos</p>
        </div>
      </div>

      {/* Materias por año */}
      {byYear.length > 0 && (
        <div className="space-y-12">
          {byYear.map(([year, list]) => {
            const yearStats = {
              done: list.filter(s => s.state === 'done').length,
              current: list.filter(s => s.state === 'current').length,
              recursant: list.filter(s => s.state === 'recursant').length,
              available: list.filter(s => s.state === 'available').length,
              total: list.length
            }
            
            return (
              <section key={year} className="space-y-6">
                {/* Year Header */}
                <div className="flex items-end gap-4 pb-4 border-b-4 border-gradient-to-r from-indigo-600 to-purple-600">
                  <div>
                    <h2 className="text-4xl font-black text-gray-900">Año {year}</h2>
                    <div className="flex gap-4 mt-2 text-sm flex-wrap">
                      <span className="text-emerald-600 font-semibold">{yearStats.done}/{yearStats.total} Aprobadas</span>
                      <span className="text-blue-600 font-semibold">{yearStats.current} En curso</span>
                      <span className="text-orange-600 font-semibold">{yearStats.recursant} Recursantes</span>
                      <span className="text-amber-600 font-semibold">{yearStats.available} Disponibles</span>
                    </div>
                  </div>
                  <div className="ml-auto">
                    <div className="text-right">
                      <p className="text-sm text-gray-600 font-semibold">Progreso</p>
                      <div className="mt-1 w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all"
                          style={{width: `${yearStats.total > 0 ? (yearStats.done / yearStats.total) * 100 : 0}%`}}
                        ></div>
                      </div>
                      <p className="text-xs text-gray-600 mt-1">{yearStats.total > 0 ? Math.round((yearStats.done / yearStats.total) * 100) : 0}%</p>
                    </div>
                  </div>
                </div>
                
                {/* Subject Cards Grid */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {list.map((s) => {
                    const statusLabel = getStatusLabel(s.finalGrade, s.allowsPromotion)
                    const statusColor = getStatusColor(s.finalGrade, s.allowsPromotion)
                    
                    return (
                      <div
                        key={s.id}
                        className={`card rounded-2xl overflow-hidden border-2 transition-all hover:shadow-2xl hover:scale-105 ${
                          s.state === 'done'
                            ? 'border-emerald-600 bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50'
                            : s.state === 'recursant'
                              ? 'border-orange-600 bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50'
                              : s.state === 'current'
                                ? 'border-blue-600 bg-gradient-to-br from-blue-50 via-cyan-50 to-sky-50'
                                : s.state === 'available'
                                  ? 'border-amber-500 bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50'
                                  : 'border-gray-300 bg-gradient-to-br from-gray-50 via-slate-50 to-zinc-50'
                        }`}
                      >
                        {/* Header Section */}
                        <div className={`p-4 border-b-2 ${
                          s.state === 'done' ? 'border-emerald-200 bg-emerald-100/30' :
                          s.state === 'recursant' ? 'border-orange-200 bg-orange-100/30' :
                          s.state === 'current' ? 'border-blue-200 bg-blue-100/30' :
                          s.state === 'available' ? 'border-amber-200 bg-amber-100/30' :
                          'border-gray-200 bg-gray-100/30'
                        }`}>
                          <div className="flex items-start justify-between gap-2 mb-3">
                            <div className="flex items-center gap-2">
                              {s.state === 'done' && <CheckCircle2 className="h-6 w-6 text-emerald-700" />}
                              {s.state === 'recursant' && <RefreshCw className="h-6 w-6 text-orange-700" />}
                              {s.state === 'current' && <BookOpen className="h-6 w-6 text-blue-700" />}
                              {s.state === 'available' && <Zap className="h-6 w-6 text-amber-700" />}
                              {s.state === 'locked' && <Lock className="h-6 w-6 text-gray-500" />}
                              <span className="font-mono text-lg font-black text-gray-900">{s.code}</span>
                            </div>
                            {s.attempt > 1 && (
                              <span className="text-xs font-bold px-2 py-1 rounded-full bg-orange-200 text-orange-700">
                                Intento {s.attempt}
                              </span>
                            )}
                          </div>
                          
                          <h3 className="font-bold text-gray-900 text-sm leading-snug mb-2">{s.name}</h3>
                          
                          <div className="flex gap-2 flex-wrap">
                            {s.division && (
                              <span className="text-xs font-bold px-2 py-1 rounded-full bg-blue-200 text-blue-700">
                                Div. {s.division}
                              </span>
                            )}
                            <span className="text-xs font-bold px-2 py-1 rounded-full bg-gray-200 text-gray-700">
                              {getDictationLabel(s)}
                            </span>
                            {s.allowsPromotion && (
                              <span className="text-xs font-bold px-2 py-1 rounded-full bg-purple-200 text-purple-700">
                                🎓 Promocional
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Status Badge */}
                        <div className="px-4 py-3 bg-white/60 backdrop-blur-sm">
                          <p className="text-xs text-gray-600 font-bold tracking-wide mb-2">ESTADO</p>
                          <div className={`inline-block px-3 py-1 rounded-full text-sm font-bold ${
                            s.state === 'done' ? 'bg-emerald-200 text-emerald-900' :
                            s.state === 'recursant' ? 'bg-orange-200 text-orange-900' :
                            s.state === 'current' ? 'bg-blue-200 text-blue-900' :
                            s.state === 'available' ? 'bg-amber-200 text-amber-900' :
                            'bg-gray-200 text-gray-700'
                          }`}>
                            {s.state === 'done' && '✓ Aprobada'}
                            {s.state === 'recursant' && '↻ Recursante'}
                            {s.state === 'current' && '● En Curso'}
                            {s.state === 'available' && '⚡ Disponible'}
                            {s.state === 'locked' && '🔒 Bloqueada'}
                          </div>
                        </div>

                        {/* Grades Section */}
                        {(s.finalGrade !== undefined || s.partialGrade !== undefined) && (
                          <div className="px-4 py-3 border-t-2 border-gray-200 space-y-3 bg-white/40">
                            <p className="text-xs text-gray-600 font-bold tracking-wide">CALIFICACIÓN</p>
                            <div className="grid grid-cols-2 gap-2">
                              {s.partialGrade !== undefined && (
                                <div className="bg-white rounded-xl p-3 text-center border-2 border-blue-200 shadow-sm">
                                  <p className="text-xs text-blue-600 font-bold mb-1">Parcial</p>
                                  <p className="text-2xl font-black text-blue-900">{s.partialGrade !== null && s.partialGrade !== undefined ? s.partialGrade.toFixed(1) : '-'}</p>
                                </div>
                              )}
                              {s.finalGrade !== undefined && (
                                <div className={`bg-white rounded-xl p-3 text-center border-2 shadow-sm ${
                                  s.finalGrade >= 8 && s.allowsPromotion ? 'border-purple-400' :
                                  s.finalGrade >= 6 ? 'border-emerald-400' :
                                  'border-red-400'
                                }`}>
                                  <p className={`text-xs font-bold mb-1 ${
                                    s.finalGrade >= 8 && s.allowsPromotion ? 'text-purple-700' :
                                    s.finalGrade >= 6 ? 'text-emerald-700' :
                                    'text-red-700'
                                  }`}>
                                    Final
                                  </p>
                                  <p className={`text-2xl font-black ${
                                    s.finalGrade >= 8 && s.allowsPromotion ? 'text-purple-900' :
                                    s.finalGrade >= 6 ? 'text-emerald-900' :
                                    'text-red-900'
                                  }`}>
                                    {s.finalGrade !== null && s.finalGrade !== undefined ? s.finalGrade.toFixed(1) : '-'}
                                  </p>
                                </div>
                              )}
                            </div>
                            
                            {statusLabel && (
                              <div className={`mt-2 p-3 rounded-xl text-center text-sm font-bold ${statusColor} bg-white/60 border-2 ${
                                s.allowsPromotion && s.finalGrade >= 8 ? 'border-purple-400' :
                                s.finalGrade >= 6 ? 'border-emerald-400' :
                                'border-red-400'
                              }`}>
                                {s.allowsPromotion && s.finalGrade >= 8 && (
                                  <div className="flex items-center justify-center gap-1">
                                    <Award size={16} />
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

                            {!statusLabel && (s.partialStatus || s.finalStatus) && (
                              <div className={`mt-2 p-3 rounded-xl text-center text-sm font-bold bg-white/60 border-2 ${
                                s.partialStatus === 'promocionado' ? 'border-green-400 text-green-700' :
                                s.partialStatus === 'regular' ? 'border-yellow-400 text-yellow-700' :
                                s.partialStatus === 'desaprobado' ? 'border-red-400 text-red-700' :
                                'border-blue-400 text-blue-700'
                              }`}>
                                {s.partialStatus === 'promocionado' && '🎓 Promocionado (parcial)'}
                                {s.partialStatus === 'regular' && '📖 Regular (en espera de final)'}
                                {s.partialStatus === 'desaprobado' && '❌ Desaprobado'}
                                {!s.partialStatus && '⏳ En proceso'}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Correlatives Section */}
                        {s.blockedByCorrelatives.length > 0 && (
                          <div className="px-4 py-3 border-t-2 border-yellow-200 bg-yellow-50/80">
                            <div className="flex items-center gap-1 text-xs font-bold text-amber-700 mb-2">
                              <AlertCircle className="h-4 w-4" />
                              Requiere aprobar:
                            </div>
                            <div className="space-y-1">
                              {s.blockedByCorrelatives.map((corr) => (
                                <div key={corr.id} className="text-xs text-amber-900 bg-white/50 px-2 py-1 rounded">
                                  <span className="font-mono font-bold">{corr.code}</span>
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
            )
          })}
        </div>
      )}

      {subjects.length === 0 && (
        <div className="card p-16 text-center rounded-3xl bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-gray-200">
          <BookOpen size={64} className="mx-auto text-gray-400 mb-6" />
          <p className="text-gray-600 text-xl font-semibold">No hay materias catalogadas</p>
          <p className="text-gray-500 mt-2">Para tu programa aún no se han registrado asignaturas</p>
        </div>
      )}

      {/* Info Box */}
      {subjects.length > 0 && (
        <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-3xl p-8 text-white shadow-2xl">
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-2xl font-black mb-4 flex items-center gap-2">
                <span className="text-3xl">📌</span>
                Estados
              </h3>
              <ul className="space-y-2 text-indigo-50">
                <li><strong>✓ Aprobada:</strong> Ya cursaste y aprobaste con nota final</li>
                <li><strong>● En curso:</strong> Actualmente inscripto sin calificaciones finales</li>
                <li><strong>⚡ Disponible:</strong> Podés inscribirte ahora</li>
                <li><strong>↻ Recursante:</strong> Cursaste pero no aprobaste - Nuevo intento</li>
                <li><strong>🔒 Bloqueada:</strong> Falta correlativa o no es tu año</li>
              </ul>
            </div>
            <div>
              <h3 className="text-2xl font-black mb-4 flex items-center gap-2">
                <span className="text-3xl">📊</span>
                Calificaciones
              </h3>
              <ul className="space-y-2 text-indigo-50">
                <li><strong>Parcial:</strong> Promedio de trabajos y parciales cargados</li>
                <li><strong>Final:</strong> Nota del examen final (después que rindas)</li>
                <li><strong>🎓 Promocionado:</strong> ≥8 en materia que lo permite</li>
                <li><strong>📖 Regular:</strong> Parcial ≥6 - Pendiente de final</li>
                <li><strong>Aprobado:</strong> Entre 6-7 ó ≥8 sin promoción</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
