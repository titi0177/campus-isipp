import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/components/Toast'
import { FileText, ChevronDown } from 'lucide-react'
import { ProfessorGradeLoader } from '@/components/ProfessorGradeLoader'
import { ProfessorRegularGrades } from '@/components/ProfessorRegularGrades'
import { ProfessorApprovedHistory } from '@/components/ProfessorApprovedHistory'
import { ProfessorDisapprovedManagement } from '@/components/ProfessorDisapprovedManagement'

export const Route = createFileRoute('/professor/grades')({
  component: ProfessorGradesPage,
})

type Subject = {
  id: string
  name: string
  code: string
  year: number
  division?: string | null
}

type Enrollment = {
  id: string
  student_id: string
  student_name: string
  subject_id: string
}

function ProfessorGradesPage() {
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [selectedSubject, setSelectedSubject] = useState('')
  const [showAllYears, setShowAllYears] = useState(false)
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'load' | 'regulars' | 'history' | 'disapproved'>('load')
  const { showToast } = useToast()

  useEffect(() => {
    void loadSubjects()
  }, [])

  async function loadSubjects() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: prof } = await supabase
        .from('professors')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (!prof?.id) {
        setSubjects([])
        return
      }

      const { data } = await supabase
        .from('subjects')
        .select('id, name, code, year, division')
        .eq('professor_id', prof.id)
        .order('year')
        .order('code')

      setSubjects(data ?? [])
    } catch (err) {
      console.error('Error loading subjects:', err)
      showToast('Error al cargar materias', 'error')
    }
  }

  async function loadEnrollments(subjectId: string) {
    try {
      setLoading(true)
      const subject = subjects.find(s => s.id === subjectId)

      const { data } = await supabase
        .from('enrollments')
        .select('id, division, student_id, student:students(id, first_name, last_name, year)')
        .eq('subject_id', subjectId)
        .order('student(last_name)')

      if (data) {
        let formatted: Enrollment[] = data.map((e: any) => ({
          id: e.id,
          student_id: e.student.id,
          student_name: `${e.student.last_name}, ${e.student.first_name}`,
          subject_id: subjectId,
          division: e.division,
        }))
        
        if (subject && !showAllYears) {
          formatted = formatted.filter((e: any) => {
            const studentYear = data.find((d: any) => d.id === e.id)?.student?.year
            return studentYear === subject.year
          })
        }
        
        setEnrollments(formatted)
      }

      setLoading(false)
    } catch (err) {
      console.error('Error loading enrollments:', err)
      showToast('Error al cargar alumnos', 'error')
      setLoading(false)
    }
  }

  const handleSubjectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value
    setSelectedSubject(id)
    setActiveTab('load')
    if (id) {
      void loadEnrollments(id)
    } else {
      setEnrollments([])
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-3xl p-8 text-white shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-indigo-100 text-sm font-semibold mb-2">Sistema Academico</p>
            <h1 className="text-5xl font-black mb-3">Carga de Calificaciones</h1>
            <p className="text-indigo-100 text-lg">
              Carga flexible de notas parciales (1-6) y finales con promocion automatica
            </p>
          </div>
          <FileText size={80} className="opacity-20" />
        </div>
      </div>

      {/* Selector de Materia */}
      <div className="card p-6">
        <label htmlFor="subject-select" className="block text-sm font-bold text-gray-900 mb-3">
          Seleccionar Materia *
        </label>
        <select
          id="subject-select"
          value={selectedSubject}
          onChange={handleSubjectChange}
          className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-gray-900 font-semibold focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-200"
        >
          <option value="">-- Selecciona una materia --</option>
          {subjects.map(s => (
            <option key={s.id} value={s.id}>
              {s.code} - {s.name} {s.division ? `(Div. ${s.division})` : ''}
            </option>
          ))}
        </select>
      </div>

      {selectedSubject && (
        <>
          {/* Filtro de Anos */}
          <div className="card p-4 bg-purple-50 border-2 border-purple-200 rounded-lg">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showAllYears}
                onChange={(e) => {
                  setShowAllYears(e.target.checked)
                  if (selectedSubject) void loadEnrollments(selectedSubject)
                }}
                className="w-4 h-4 rounded"
              />
              <span className="text-sm font-semibold text-purple-900">Mostrar alumnos de todos los anos (incluyendo avanzados)</span>
            </label>
            <p className="text-xs text-purple-700 mt-2 ml-6">Sin marcar: solo se muestran alumnos del ano correspondiente a la materia</p>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 border-b border-gray-200 flex-wrap">
            <button
              onClick={() => setActiveTab('load')}
              className={`px-6 py-3 font-bold text-sm border-b-2 transition-colors ${
                activeTab === 'load'
                  ? 'border-b-indigo-600 text-indigo-600'
                  : 'border-b-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Carga de Notas Parciales
            </button>
            <button
              onClick={() => setActiveTab('regulars')}
              className={`px-6 py-3 font-bold text-sm border-b-2 transition-colors ${
                activeTab === 'regulars'
                  ? 'border-b-amber-600 text-amber-600'
                  : 'border-b-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Notas Finales (Regulares)
            </button>
            <button
              onClick={() => setActiveTab('disapproved')}
              className={`px-6 py-3 font-bold text-sm border-b-2 transition-colors ${
                activeTab === 'disapproved'
                  ? 'border-b-red-600 text-red-600'
                  : 'border-b-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Desaprobados
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-6 py-3 font-bold text-sm border-b-2 transition-colors ${
                activeTab === 'history'
                  ? 'border-b-emerald-600 text-emerald-600'
                  : 'border-b-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Historial de Aprobados
            </button>
          </div>

          {/* Content */}
          {loading ? (
            <div className="card p-12 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-indigo-200 border-t-indigo-600 mb-4"></div>
              <p className="text-slate-600">Cargando alumnos...</p>
            </div>
          ) : activeTab === 'load' ? (
            <>
              {enrollments.length > 0 ? (
                <>
                  <div className="card p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200">
                    <h3 className="font-bold text-blue-900 mb-2">Informacion del Sistema</h3>
                    <ul className="text-sm text-blue-900 space-y-1">
                      <li>Selecciona cuantas notas usaras (1-6)</li>
                      <li>El promedio parcial se calcula automaticamente al completar todas las notas</li>
                      <li>Estados: Promocionado (mayor o igual a 8), Regular (6-7), Desaprobado (menor a 6)</li>
                      <li>Las notas finales se cargan en la seccion Regulares</li>
                      <li>Puedes cargar 1 o mas notas a la vez - el sistema permite carga parcial</li>
                    </ul>
                  </div>
                  <ProfessorGradeLoader enrollments={enrollments} subjectId={selectedSubject} />
                </>
              ) : (
                <div className="card p-6 text-center bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200">
                  <p className="text-green-800 font-semibold">
                    No hay alumnos inscritos en esta materia o todos tienen calificaciones completas
                  </p>
                </div>
              )}
            </>
          ) : activeTab === 'regulars' ? (
            <>
              <div className="card p-4 bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-200">
                <h3 className="font-bold text-amber-900 mb-2">Notas Finales para Regulares</h3>
                <p className="text-sm text-amber-900">
                  Aqui puedes cargar las notas finales de los estudiantes en condicion Regular (parcial mayor o igual a 6).
                </p>
              </div>
              <ProfessorRegularGrades subjectId={selectedSubject} />
            </>
          ) : activeTab === 'disapproved' ? (
            <>
              <div className="card p-4 bg-gradient-to-r from-red-50 to-orange-50 border-2 border-red-200">
                <h3 className="font-bold text-red-900 mb-2">Gestion de Desaprobados</h3>
                <p className="text-sm text-red-900">
                  Aqui puedes reinscribir a los alumnos desaprobados como recursantes (2do intento)
                </p>
              </div>
              <ProfessorDisapprovedManagement subjectId={selectedSubject} />
            </>
          ) : (
            <>
              <div className="card p-4 bg-gradient-to-r from-emerald-50 to-teal-50 border-2 border-emerald-200">
                <h3 className="font-bold text-emerald-900 mb-2">Historial de Calificaciones</h3>
                <p className="text-sm text-emerald-900">
                  Visualiza el registro completo de todos los alumnos con sus notas parciales y finales, estados y condiciones academicas.
                </p>
              </div>
              <ProfessorApprovedHistory subjectId={selectedSubject} subjectName={subjects.find(s => s.id === selectedSubject)?.name || ''} />
            </>
          )}
        </>
      )}

      {!selectedSubject && (
        <div className="card p-12 text-center bg-gradient-to-br from-gray-50 to-slate-50 border-2 border-gray-200 rounded-2xl">
          <ChevronDown size={48} className="mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600 text-lg font-semibold">Selecciona una materia para comenzar</p>
        </div>
      )}
    </div>
  )
}