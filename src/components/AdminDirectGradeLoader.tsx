import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { AlertCircle, Save, Download } from 'lucide-react'

type Career = {
  id: string
  name: string
}

type Subject = {
  id: string
  code: string
  name: string
  year: number
}

type StudentGrade = {
  id: string
  enrollment_id: string
  student_id: string
  student_name: string
  legajo: string
  final_grade: number | null
  final_status: string | null
}

export function AdminDirectGradeLoader() {
  const [careers, setCareers] = useState<Career[]>([])
  const [selectedCareer, setSelectedCareer] = useState('')
  const [years, setYears] = useState<number[]>([])
  const [selectedYear, setSelectedYear] = useState('')
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [selectedSubject, setSelectedSubject] = useState('')
  const [studentGrades, setStudentGrades] = useState<StudentGrade[]>([])
  const [grades, setGrades] = useState<Record<string, number | null>>({})
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Cargar carreras
  useEffect(() => {
    loadCareers()
  }, [])

  // Cargar años y materias cuando selecciona carrera
  useEffect(() => {
    if (selectedCareer) {
      loadYearsAndSubjects()
    }
  }, [selectedCareer])

  // Cargar estudiantes cuando selecciona materia
  useEffect(() => {
    if (selectedSubject) {
      loadStudentGrades()
    }
  }, [selectedSubject])

  const loadCareers = async () => {
    try {
      const { data, error: err } = await supabase
        .from('programs')
        .select('id, name')
        .order('name')

      if (err) throw err
      setCareers(data || [])
    } catch (err) {
      console.error('Error loading careers:', err)
      setError('Error al cargar carreras')
    }
  }

  const loadYearsAndSubjects = async () => {
    try {
      setLoading(true)
      setError('')
      setYears([])
      setSubjects([])
      setSelectedYear('')
      setSelectedSubject('')

      const { data, error: err } = await supabase
        .from('subjects')
        .select('id, code, name, year')
        .eq('program_id', selectedCareer)
        .order('year', { ascending: true })
        .order('code', { ascending: true })

      if (err) throw err

      if (data) {
        const uniqueYears = [...new Set(data.map(s => s.year))].sort((a, b) => a - b)
        setYears(uniqueYears)
        setSubjects(data)
      }

      setLoading(false)
    } catch (err) {
      console.error('Error loading years and subjects:', err)
      setError('Error al cargar años y materias')
      setLoading(false)
    }
  }

  const loadStudentGrades = async () => {
    try {
      setLoading(true)
      setError('')

      const { data, error: err } = await supabase
        .from('enrollments')
        .select(`
          id,
          student_id,
          enrollment_grades(
            id,
            final_grade,
            final_status
          ),
          student:students(first_name, last_name, legajo)
        `)
        .eq('subject_id', selectedSubject)

      if (err) throw err

      if (data) {
        const formatted = data.map((e: any) => {
          const grades = Array.isArray(e.enrollment_grades) ? e.enrollment_grades[0] : e.enrollment_grades
          return {
            id: grades?.id || '',
            enrollment_id: e.id,
            student_id: e.student_id,
            student_name: `${e.student.last_name}, ${e.student.first_name}`,
            legajo: e.student.legajo || 'S/N',
            final_grade: grades?.final_grade || null,
            final_status: grades?.final_status || null,
          }
        })

        // Ordenar por legajo en el cliente
        formatted.sort((a, b) => a.legajo.localeCompare(b.legajo))

        setStudentGrades(formatted)

        // Inicializar grades con notas existentes
        const initialGrades: Record<string, number | null> = {}
        formatted.forEach(sg => {
          initialGrades[sg.enrollment_id] = sg.final_grade
        })
        setGrades(initialGrades)
      }

      setLoading(false)
    } catch (err) {
      console.error('Error loading student grades:', err)
      setError('Error al cargar alumnos')
      setLoading(false)
    }
  }

  const handleGradeChange = (enrollmentId: string, value: string) => {
    const numValue = value === '' ? null : parseFloat(value)
    setGrades(prev => ({
      ...prev,
      [enrollmentId]: numValue,
    }))
  }

  const handleSaveGrades = async () => {
    setSaving(true)
    setError('')

    try {
      let savedCount = 0

      for (const student of studentGrades) {
        const newGrade = grades[student.enrollment_id]

        // Solo guardar si hay cambio
        if (newGrade === null || newGrade === student.final_grade) {
          continue
        }

        const payload = {
          enrollment_id: student.enrollment_id,
          final_grade: newGrade,
          final_status: newGrade >= 6 ? 'aprobado' : 'desaprobado',
          attempt_number: 1,
        }

        let result

        if (student.id) {
          // Actualizar
          result = await supabase
            .from('enrollment_grades')
            .update(payload)
            .eq('id', student.id)
        } else {
          // Crear
          result = await supabase
            .from('enrollment_grades')
            .insert([payload])
        }

        if (result.error) {
          console.error(`Error saving grade for ${student.student_name}:`, result.error)
          setError(`Error al guardar nota de ${student.student_name}`)
          setSaving(false)
          return
        }

        savedCount++
      }

      setError('')
      alert(`${savedCount} calificacion${savedCount !== 1 ? 'es' : ''} guardada${savedCount !== 1 ? 's' : ''} correctamente`)
      await loadStudentGrades()
    } catch (err) {
      console.error('Error:', err)
      setError('Error al guardar: ' + String(err))
    } finally {
      setSaving(false)
    }
  }

  const hasChanges = studentGrades.some(
    sg => grades[sg.enrollment_id] !== sg.final_grade && grades[sg.enrollment_id] !== null
  )

  const selectedSubjectData = subjects.find(s => s.id === selectedSubject)
  const filteredSubjects = selectedYear ? subjects.filter(s => s.year === parseInt(selectedYear)) : []

  return (
    <div className="space-y-6">
      <div className="card p-6 bg-gradient-to-r from-indigo-50 to-blue-50 border-2 border-indigo-200">
        <h2 className="text-2xl font-bold text-indigo-900 mb-2">Carga Directa de Notas Finales</h2>
        <p className="text-sm text-indigo-800">
          Carga notas finales directamente para materias de 1er año y equivalencias
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm flex gap-2">
          <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
          {error}
        </div>
      )}

      {/* Selectores */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Carrera */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Carrera</label>
          <select
            value={selectedCareer}
            onChange={e => setSelectedCareer(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">-- Selecciona carrera --</option>
            {careers.map(c => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Año */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Año</label>
          <select
            value={selectedYear}
            onChange={e => setSelectedYear(e.target.value)}
            disabled={!selectedCareer}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            <option value="">-- Selecciona año --</option>
            {years.map(y => (
              <option key={y} value={y}>
                {y} año
              </option>
            ))}
          </select>
        </div>

        {/* Materia */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Materia</label>
          <select
            value={selectedSubject}
            onChange={e => setSelectedSubject(e.target.value)}
            disabled={!selectedYear}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            <option value="">-- Selecciona materia --</option>
            {filteredSubjects.map(s => (
              <option key={s.id} value={s.id}>
                {s.code} - {s.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Tabla de alumnos */}
      {selectedSubject && (
        <>
          <div className="card p-4 bg-blue-50 border-2 border-blue-200">
            <h3 className="font-bold text-blue-900 mb-2">Informacion de la Materia</h3>
            <p className="text-sm text-blue-900">
              <strong>Carrera:</strong> {careers.find(c => c.id === selectedCareer)?.name} | 
              <strong className="ml-3">Ano:</strong> {selectedYear} | 
              <strong className="ml-3">Materia:</strong> {selectedSubjectData?.code} - {selectedSubjectData?.name}
            </p>
            <p className="text-sm text-blue-900 mt-2">
              <strong>Total de alumnos:</strong> {studentGrades.length}
            </p>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-indigo-200 border-t-indigo-600 mb-4"></div>
              <p className="text-slate-600">Cargando alumnos...</p>
            </div>
          ) : studentGrades.length === 0 ? (
            <div className="card p-6 text-center bg-gray-50 border border-gray-200">
              <p className="text-gray-600">No hay alumnos inscritos en esta materia</p>
            </div>
          ) : (
            <>
              <div className="card p-0 overflow-hidden rounded-lg border border-gray-200">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white">
                        <th className="px-4 py-3 text-left font-bold">Legajo</th>
                        <th className="px-4 py-3 text-left font-bold">Alumno</th>
                        <th className="px-4 py-3 text-center font-bold">Nota Final</th>
                        <th className="px-4 py-3 text-center font-bold">Estado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {studentGrades.map((sg, idx) => {
                        const gradeValue = grades[sg.enrollment_id]
                        const status = gradeValue !== null && gradeValue !== undefined 
                          ? (gradeValue >= 6 ? 'Aprobado' : 'Desaprobado')
                          : (sg.final_status ? sg.final_status.charAt(0).toUpperCase() + sg.final_status.slice(1) : '-')
                        const statusColor = gradeValue !== null && gradeValue !== undefined
                          ? (gradeValue >= 6 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700')
                          : (sg.final_status === 'aprobado' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700')

                        return (
                          <tr key={sg.enrollment_id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                            <td className="px-4 py-3 font-semibold text-gray-900">{sg.legajo}</td>
                            <td className="px-4 py-3 text-gray-900">{sg.student_name}</td>
                            <td className="px-4 py-3 text-center">
                              <input
                                type="number"
                                min="0"
                                max="10"
                                step="0.1"
                                value={gradeValue ?? ''}
                                onChange={e => handleGradeChange(sg.enrollment_id, e.target.value)}
                                className="w-20 px-2 py-1 border border-gray-300 rounded text-center text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                placeholder="-"
                              />
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className={`inline-block px-2 py-1 rounded text-xs font-bold ${statusColor}`}>
                                {status}
                              </span>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              <button
                onClick={handleSaveGrades}
                disabled={!hasChanges || saving}
                className="w-full bg-gradient-to-r from-indigo-600 to-blue-600 hover:shadow-lg text-white font-bold py-3 rounded-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Save size={20} />
                {saving ? 'Guardando...' : 'Guardar Notas Finales'}
              </button>
            </>
          )}
        </>
      )}
    </div>
  )
}
