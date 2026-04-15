import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/components/Toast'
import { Save } from 'lucide-react'

export const Route = createFileRoute('/professor/grades')({
  component: ProfessorGradesPage,
})

type StudentGrade = {
  enrollmentId: string
  division?: string | null
  studentName: string
  partial1?: number
  partial2?: number
  partial3?: number
  practical1?: number
  practical2?: number
  practical3?: number
  finalGradeExam?: number
  avgPartials?: number
  avgPracticals?: number
  partialGrade?: number
  status?: string
}

function ProfessorGradesPage() {
  const [subjects, setSubjects] = useState<any[]>([])
  const [selectedSubject, setSelectedSubject] = useState('')
  const [selectedDivision, setSelectedDivision] = useState<string | null>(null)
  const [students, setStudents] = useState<StudentGrade[]>([])
  const [loading, setLoading] = useState(false)
  const [schemaReady, setSchemaReady] = useState(false)
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
        .maybeSingle()

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

  function getDivisionLabel(subject: any) {
    return subject.division ? ` - Div. ${subject.division}` : ''
  }

  async function loadStudents(subjectId: string, division: string | null) {
    try {
      setLoading(true)

      const baseQuery = supabase
        .from('enrollments')
        .select(`
          id,
          division,
          student:students(first_name, last_name),
          grades(
            id,
            partial_1, partial_2, partial_3,
            practical_1, practical_2, practical_3,
            partial_grade,
            final_grade_exam,
            final_grade,
            status
          )
        `)
        .eq('subject_id', subjectId)
        .order('student(last_name)')

      const query = division 
        ? baseQuery.eq('division', division)
        : baseQuery

      const { data: enrollmentsData, error } = await query

      if (error) {
        console.error('Error loading students:', error)
        showToast('Error al cargar alumnos', 'error')
        setStudents([])
        return
      }

      const hasNewSchema = enrollmentsData && enrollmentsData.length > 0 && 
        enrollmentsData[0].grades && 
        'partial_1' in (Array.isArray(enrollmentsData[0].grades) ? enrollmentsData[0].grades[0] : enrollmentsData[0].grades)
      
      setSchemaReady(hasNewSchema || false)

      if (enrollmentsData) {
        const studentList: StudentGrade[] = enrollmentsData.map((enrollment: any) => {
          const grade = Array.isArray(enrollment.grades) ? enrollment.grades[0] : enrollment.grades

          if (hasNewSchema && grade) {
            const partials = [grade?.partial_1, grade?.partial_2, grade?.partial_3].filter(p => p != null)
            const practicals = [grade?.practical_1, grade?.practical_2, grade?.practical_3].filter(p => p != null)

            const avgPartials = partials.length > 0 ? Math.round((partials.reduce((a, b) => a + b, 0) / partials.length) * 100) / 100 : undefined
            const avgPracticals = practicals.length > 0 ? Math.round((practicals.reduce((a, b) => a + b, 0) / practicals.length) * 100) / 100 : undefined

            const allGrades = [...(partials || []), ...(practicals || [])]
            const partialGrade = allGrades.length > 0 ? Math.round((allGrades.reduce((a, b) => a + b, 0) / allGrades.length) * 100) / 100 : undefined

            let status = 'in_progress'
            if (grade?.final_grade_exam != null) {
              if (grade.final_grade_exam >= 8) status = 'promoted'
              else if (grade.final_grade_exam >= 6) status = 'passed'
              else status = 'failed'
            }

            return {
              enrollmentId: enrollment.id,
              division: enrollment.division,
              studentName: `${enrollment.student?.last_name || 'Sin'}, ${enrollment.student?.first_name || 'Nombre'}`,
              partial1: grade?.partial_1,
              partial2: grade?.partial_2,
              partial3: grade?.partial_3,
              practical1: grade?.practical_1,
              practical2: grade?.practical_2,
              practical3: grade?.practical_3,
              finalGradeExam: grade?.final_grade_exam,
              avgPartials,
              avgPracticals,
              partialGrade,
              status,
            }
          } else {
            const partialGrade = grade?.partial_grade
            const finalGrade = grade?.final_grade_exam || grade?.final_grade

            let status = grade?.status || 'in_progress'

            return {
              enrollmentId: enrollment.id,
              division: enrollment.division,
              studentName: `${enrollment.student?.last_name || 'Sin'}, ${enrollment.student?.first_name || 'Nombre'}`,
              partialGrade,
              finalGradeExam: finalGrade,
              status,
            }
          }
        })

        setStudents(studentList)
      }
    } catch (err) {
      console.error('Error loading students:', err)
      showToast('Error al cargar alumnos', 'error')
    } finally {
      setLoading(false)
    }
  }

  function updateValue(enrollmentId: string, field: string, value: number | '') {
    setStudents(prev => prev.map(s => {
      if (s.enrollmentId === enrollmentId) {
        const updated = { ...s, [field]: value === '' ? undefined : value }

        if (schemaReady && ['partial1', 'partial2', 'partial3', 'practical1', 'practical2', 'practical3'].includes(field)) {
          const partials = [updated.partial1, updated.partial2, updated.partial3].filter(p => p != null)
          const practicals = [updated.practical1, updated.practical2, updated.practical3].filter(p => p != null)

          updated.avgPartials = partials.length > 0 ? Math.round((partials.reduce((a, b) => a + b, 0) / partials.length) * 100) / 100 : undefined
          updated.avgPracticals = practicals.length > 0 ? Math.round((practicals.reduce((a, b) => a + b, 0) / practicals.length) * 100) / 100 : undefined

          const allGrades = [...(partials || []), ...(practicals || [])]
          updated.partialGrade = allGrades.length > 0 ? Math.round((allGrades.reduce((a, b) => a + b, 0) / allGrades.length) * 100) / 100 : undefined
        }

        if (field === 'finalGradeExam') {
          if (updated.finalGradeExam == null) {
            updated.status = 'in_progress'
          } else if (updated.finalGradeExam >= 8) {
            updated.status = 'promoted'
          } else if (updated.finalGradeExam >= 6) {
            updated.status = 'passed'
          } else {
            updated.status = 'failed'
          }
        }

        return updated
      }
      return s
    }))
  }

  async function saveGrades() {
    try {
      for (const student of students) {
        const { data: existing } = await supabase
          .from('grades')
          .select('id')
          .eq('enrollment_id', student.enrollmentId)
          .maybeSingle()

        let gradeData: any = {}

        if (schemaReady) {
          const partials = [student.partial1, student.partial2, student.partial3].filter(p => p != null)
          const practicals = [student.practical1, student.practical2, student.practical3].filter(p => p != null)
          const allGrades = [...partials, ...practicals]
          const partialGrade = allGrades.length > 0 ? Math.round((allGrades.reduce((a, b) => a + b, 0) / allGrades.length) * 100) / 100 : null

          let status = 'in_progress'
          if (student.finalGradeExam != null) {
            if (student.finalGradeExam >= 8) status = 'promoted'
            else if (student.finalGradeExam >= 6) status = 'passed'
            else status = 'failed'
          }

          gradeData = {
            partial_1: student.partial1 || null,
            partial_2: student.partial2 || null,
            partial_3: student.partial3 || null,
            practical_1: student.practical1 || null,
            practical_2: student.practical2 || null,
            practical_3: student.practical3 || null,
            partial_grade: partialGrade,
            final_grade_exam: student.finalGradeExam || null,
            final_grade: student.finalGradeExam || null,
            status,
          }
        } else {
          gradeData = {
            partial_grade: student.partialGrade || null,
            final_grade_exam: student.finalGradeExam || null,
            final_grade: student.finalGradeExam || null,
            status: student.status || 'in_progress',
          }
        }

        if (existing?.id) {
          await supabase
            .from('grades')
            .update(gradeData)
            .eq('id', existing.id)
        } else {
          await supabase
            .from('grades')
            .insert({
              enrollment_id: student.enrollmentId,
              ...gradeData,
            })
        }
      }

      showToast('Notas guardadas correctamente', 'success')
    } catch (err) {
      console.error('Error saving grades:', err)
      showToast('Error al guardar notas', 'error')
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Carga de Calificaciones</h1>
        <p className="text-sm text-slate-600 mt-1">
          {schemaReady 
            ? 'Carga de parciales, trabajos prácticos y nota final'
            : 'Sistema con nota parcial y final'}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl">
        <div>
          <label htmlFor="subject-select" className="form-label">Seleccionar materia</label>
          <select
            id="subject-select"
            name="subject"
            className="form-input"
            value={selectedSubject}
            onChange={(e) => {
              const v = e.target.value
              setSelectedSubject(v)
              setSelectedDivision(null)
              if (v) void loadStudents(v, null)
              else setStudents([])
            }}
          >
            <option value="">-- Selecciona materia --</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.code} - {s.name}{getDivisionLabel(s)}
              </option>
            ))}
          </select>
        </div>

        {selectedSubject && subjects.find(s => s.id === selectedSubject)?.year === 1 && (
          <div>
            <label htmlFor="division-select" className="form-label">División (Año 1)</label>
            <select
              id="division-select"
              className="form-input"
              value={selectedDivision || ''}
              onChange={(e) => {
                const div = e.target.value || null
                setSelectedDivision(div)
                void loadStudents(selectedSubject, div)
              }}
            >
              <option value="">Ver ambas divisiones</option>
              <option value="A">División A</option>
              <option value="B">División B</option>
            </select>
          </div>
        )}
      </div>

      {students.length > 0 && (
        <div className="space-y-4">
          <div className="card p-4 bg-blue-50 border border-blue-200">
            <p className="text-sm text-blue-900">
              <strong>Importante:</strong> La nota PARCIAL solo AUTORIZA rendir examen final (mínimo 6/10).
              La nota que determina aprobado/desaprobado/promocionado es la NOTA FINAL (después de rendir examen).
            </p>
          </div>

          <div className="card p-0 overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-slate-700 text-white border-b">
                  <th className="px-3 py-2 text-left min-w-32">Alumno</th>
                  {selectedDivision && <th className="px-3 py-2 text-center bg-slate-800 min-w-12">Div.</th>}
                  {schemaReady && (
                    <>
                      <th colSpan={3} className="px-3 py-2 text-center bg-blue-700">Parciales</th>
                      <th colSpan={3} className="px-3 py-2 text-center bg-purple-700">Trabajos Prácticos</th>
                      <th className="px-3 py-2 text-center bg-amber-700 min-w-20">Nota Parcial</th>
                    </>
                  )}
                  {!schemaReady && (
                    <th className="px-3 py-2 text-center bg-amber-700 min-w-20">Nota Parcial</th>
                  )}
                  <th className="px-3 py-2 text-center bg-green-700 min-w-20">Nota Final</th>
                  <th className="px-3 py-2 text-center bg-slate-600 min-w-24">Estado</th>
                </tr>
                {schemaReady && (
                  <tr className="bg-slate-600 text-white text-xs">
                    <th className="px-3 py-1"></th>
                    {selectedDivision && <th className="px-3 py-1"></th>}
                    <th className="px-2 py-1 text-center">P1</th>
                    <th className="px-2 py-1 text-center">P2</th>
                    <th className="px-2 py-1 text-center">P3</th>
                    <th className="px-2 py-1 text-center">TP1</th>
                    <th className="px-2 py-1 text-center">TP2</th>
                    <th className="px-2 py-1 text-center">TP3</th>
                    <th className="px-2 py-1 text-center">Prom</th>
                    <th className="px-2 py-1 text-center">Examen</th>
                    <th className="px-2 py-1 text-center"></th>
                  </tr>
                )}
              </thead>
              <tbody>
                {students.map((student) => (
                  <tr key={student.enrollmentId} className="border-b hover:bg-slate-50">
                    <td className="px-3 py-2 font-medium">{student.studentName}</td>
                    {selectedDivision && <td className="px-3 py-2 text-center font-bold text-blue-600">{student.division}</td>}
                    {schemaReady && (
                      <>
                        <td className="px-2 py-2">
                          <input
                            id={`partial1-${student.enrollmentId}`}
                            type="number"
                            min="0"
                            max="10"
                            step="0.5"
                            className="form-input text-center w-12"
                            value={student.partial1 ?? ''}
                            onChange={(e) => updateValue(student.enrollmentId, 'partial1', e.target.value === '' ? '' : +e.target.value)}
                          />
                        </td>
                        <td className="px-2 py-2">
                          <input
                            id={`partial2-${student.enrollmentId}`}
                            type="number"
                            min="0"
                            max="10"
                            step="0.5"
                            className="form-input text-center w-12"
                            value={student.partial2 ?? ''}
                            onChange={(e) => updateValue(student.enrollmentId, 'partial2', e.target.value === '' ? '' : +e.target.value)}
                          />
                        </td>
                        <td className="px-2 py-2">
                          <input
                            id={`partial3-${student.enrollmentId}`}
                            type="number"
                            min="0"
                            max="10"
                            step="0.5"
                            className="form-input text-center w-12"
                            value={student.partial3 ?? ''}
                            onChange={(e) => updateValue(student.enrollmentId, 'partial3', e.target.value === '' ? '' : +e.target.value)}
                          />
                        </td>
                        <td className="px-2 py-2">
                          <input
                            id={`practical1-${student.enrollmentId}`}
                            type="number"
                            min="0"
                            max="10"
                            step="0.5"
                            className="form-input text-center w-12"
                            value={student.practical1 ?? ''}
                            onChange={(e) => updateValue(student.enrollmentId, 'practical1', e.target.value === '' ? '' : +e.target.value)}
                          />
                        </td>
                        <td className="px-2 py-2">
                          <input
                            id={`practical2-${student.enrollmentId}`}
                            type="number"
                            min="0"
                            max="10"
                            step="0.5"
                            className="form-input text-center w-12"
                            value={student.practical2 ?? ''}
                            onChange={(e) => updateValue(student.enrollmentId, 'practical2', e.target.value === '' ? '' : +e.target.value)}
                          />
                        </td>
                        <td className="px-2 py-2">
                          <input
                            id={`practical3-${student.enrollmentId}`}
                            type="number"
                            min="0"
                            max="10"
                            step="0.5"
                            className="form-input text-center w-12"
                            value={student.practical3 ?? ''}
                            onChange={(e) => updateValue(student.enrollmentId, 'practical3', e.target.value === '' ? '' : +e.target.value)}
                          />
                        </td>
                        <td className="px-2 py-2 text-center font-bold bg-amber-50">
                          {student.partialGrade ?? '-'}
                        </td>
                      </>
                    )}
                    {!schemaReady && (
                      <td className="px-2 py-2 text-center font-bold bg-amber-50">
                        <input
                          id={`partialGrade-${student.enrollmentId}`}
                          type="number"
                          min="0"
                          max="10"
                          step="0.5"
                          className="form-input text-center w-14"
                          value={student.partialGrade ?? ''}
                          onChange={(e) => updateValue(student.enrollmentId, 'partialGrade', e.target.value === '' ? '' : +e.target.value)}
                        />
                      </td>
                    )}
                    <td className="px-2 py-2 bg-green-50">
                      <input
                        id={`finalGrade-${student.enrollmentId}`}
                        type="number"
                        min="0"
                        max="10"
                        step="0.5"
                        className="form-input text-center w-14 font-bold"
                        value={student.finalGradeExam ?? ''}
                        onChange={(e) => updateValue(student.enrollmentId, 'finalGradeExam', e.target.value === '' ? '' : +e.target.value)}
                        title="Nota final después de rendir examen"
                      />
                    </td>
                    <td className="px-2 py-2 text-center">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${
                        student.status === 'promoted' ? 'bg-green-100 text-green-800' :
                        student.status === 'passed' ? 'bg-blue-100 text-blue-800' :
                        student.status === 'failed' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {student.status === 'promoted' ? 'Promocionado' :
                         student.status === 'passed' ? 'Aprobado' :
                         student.status === 'failed' ? 'Desaprobado' :
                         'En curso'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button
            type="button"
            onClick={() => void saveGrades()}
            className="btn-primary flex items-center gap-2"
          >
            <Save size={18} />
            Guardar todas las notas
          </button>

          {schemaReady && (
            <div className="card p-4 bg-amber-50 border border-amber-200">
              <h3 className="font-bold text-amber-900 mb-2">Notas importantes:</h3>
              <ul className="text-sm text-amber-900 space-y-1">
                <li>• <strong>Parciales:</strong> Carga hasta 3 parciales. El promedio se calcula automáticamente.</li>
                <li>• <strong>Trabajos Prácticos:</strong> Carga hasta 3 trabajos prácticos. El promedio se calcula automáticamente.</li>
                <li>• <strong>Nota Parcial:</strong> Es el promedio de todos los parciales y trabajos prácticos juntos.</li>
                <li>• <strong>Requisito:</strong> Nota parcial ≥6 para autorizar a rendir examen final.</li>
                <li>• <strong>Nota Final:</strong> Se carga DESPUÉS de que el alumno rinda el examen final.</li>
                <li>• <strong>Estado final:</strong> Se determina por la NOTA FINAL: ≥8 Promocionado, 6-7 Aprobado, &lt;6 Desaprobado.</li>
              </ul>
            </div>
          )}
        </div>
      )}

      {selectedSubject && students.length === 0 && !loading && (
        <div className="card p-6 text-center bg-green-50 border border-green-200">
          <p className="text-green-800">
            Todos los alumnos de esta materia tienen calificación asignada o no hay alumnos inscritos.
          </p>
        </div>
      )}

      {loading && (
        <div className="card p-6 text-center">
          <p className="text-slate-600">Cargando alumnos...</p>
        </div>
      )}
    </div>
  )
}
