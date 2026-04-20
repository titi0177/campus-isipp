import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { AdminDirectGradeLoader } from '@/components/AdminDirectGradeLoader'

export const Route = createFileRoute('/admin/grades')({
  component: GradesPage,
})

function GradesPage() {
  const [tab, setTab] = useState<'direct' | 'legacy'>('direct')

  return (
    <div className="space-y-6">
      <div className="card p-6 bg-gradient-to-r from-indigo-50 to-blue-50 border-2 border-indigo-200">
        <h1 className="text-3xl font-bold text-indigo-900 mb-2">Gestion de Calificaciones</h1>
        <p className="text-sm text-indigo-800">Carga de notas finales por carrera, año y materia</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        <button
          onClick={() => setTab('direct')}
          className={`px-6 py-3 font-bold text-sm transition-all ${
            tab === 'direct'
              ? 'text-indigo-600 border-b-2 border-indigo-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Carga Directa por Carrera y Ano
        </button>
        <button
          onClick={() => setTab('legacy')}
          className={`px-6 py-3 font-bold text-sm transition-all ${
            tab === 'legacy'
              ? 'text-indigo-600 border-b-2 border-indigo-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Carga por Materia
        </button>
      </div>

      {/* Tab Content */}
      {tab === 'direct' ? (
        <AdminDirectGradeLoader />
      ) : (
        <LegacyGradeLoader />
      )}
    </div>
  )
}

// Componente heredado
function LegacyGradeLoader() {
  const [subjects, setSubjects] = useState<any[]>([])
  const [selected, setSelected] = useState('')
  const [rows, setRows] = useState<any[]>([])

  const loadSubjects = async () => {
    const { data } = await (window as any).supabase.from('subjects').select('*')
    setSubjects(data || [])
  }

  const loadStudents = async (subjectId: string) => {
    const { data } = await (window as any).supabase
      .from('enrollments')
      .select(`
        id,
        student:students(first_name,last_name),
        grade:grades(*)
      `)
      .eq('subject_id', subjectId)

    setRows(data || [])
  }

  const updateValue = (i: number, key: string, val: any) => {
    const copy = [...rows]
    copy[i] = { ...copy[i], [key]: val }
    setRows(copy)
  }

  const saveAll = async () => {
    for (const r of rows) {
      const existing = r.grade?.[0]
      const final = r.final_exam_grade ?? r.partial_grade
      const status =
        final >= 7
          ? 'promoted'
          : final >= 4
            ? 'passed'
            : 'failed'

      if (existing) {
        await (window as any).supabase
          .from('grades')
          .update({
            partial_grade: r.partial_grade,
            final_exam_grade: r.final_exam_grade,
            final_grade: final,
            status,
          })
          .eq('id', existing.id)
      } else {
        await (window as any).supabase
          .from('grades')
          .insert({
            enrollment_id: r.id,
            partial_grade: r.partial_grade,
            final_exam_grade: r.final_exam_grade,
            final_grade: final,
            status,
          })
      }
    }

    alert('Notas guardadas correctamente')
  }

  return (
    <div className="card p-6 space-y-6">
      <h2 className="text-xl font-bold text-gray-900">Carga por Materia</h2>

      <select
        className="form-input w-full px-3 py-2 border border-gray-300 rounded-lg"
        value={selected}
        onChange={e => {
          setSelected(e.target.value)
          if (e.target.value) loadStudents(e.target.value)
        }}
        onFocus={loadSubjects}
      >
        <option value="">Seleccionar materia</option>
        {subjects.map(s => (
          <option key={s.id} value={s.id}>
            {s.name}
          </option>
        ))}
      </select>

      {rows.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse border border-gray-200">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-200 px-4 py-2 text-left">Alumno</th>
                <th className="border border-gray-200 px-4 py-2 text-center">Parcial</th>
                <th className="border border-gray-200 px-4 py-2 text-center">Final</th>
                <th className="border border-gray-200 px-4 py-2 text-center">Nota</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => {
                const final = r.final_exam_grade ?? r.partial_grade
                return (
                  <tr key={r.id} className="border-b border-gray-200">
                    <td className="border border-gray-200 px-4 py-2">
                      {r.student?.last_name}, {r.student?.first_name}
                    </td>
                    <td className="border border-gray-200 px-4 py-2">
                      <input
                        type="number"
                        className="w-full px-2 py-1 border border-gray-300 rounded"
                        value={r.partial_grade ?? ''}
                        onChange={e => updateValue(i, 'partial_grade', +e.target.value)}
                      />
                    </td>
                    <td className="border border-gray-200 px-4 py-2">
                      <input
                        type="number"
                        className="w-full px-2 py-1 border border-gray-300 rounded"
                        value={r.final_exam_grade ?? ''}
                        onChange={e => updateValue(i, 'final_exam_grade', +e.target.value)}
                      />
                    </td>
                    <td className="border border-gray-200 px-4 py-2 text-center font-bold">{final ?? '-'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>

          <button
            onClick={saveAll}
            className="mt-4 px-6 py-2 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Guardar todo
          </button>
        </div>
      )}
    </div>
  )
}
