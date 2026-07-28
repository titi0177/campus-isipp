import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { AdminDirectGradeLoader } from '@/components/AdminDirectGradeLoader'
import { supabase } from '@/lib/supabase'
import { Trash2 } from 'lucide-react'

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
    const { data } = await supabase.from('subjects').select('*')
    setSubjects(data || [])
  }

  const loadStudents = async (subjectId: string) => {
    const { data } = await supabase
      .from('enrollments')
      .select(`
        id,
        student:students(first_name,last_name),
        enrollment_grades(id, partial_grade, final_grade)
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
      const enrollmentGrades = Array.isArray(r.enrollment_grades) ? r.enrollment_grades[0] : r.enrollment_grades
      
      // Permitir borrar notas, pero evitar crear registros completamente vacios
      if (!enrollmentGrades?.id && (r.partial_grade === undefined || r.partial_grade === null) && (r.final_grade === undefined || r.final_grade === null)) {
        continue
      }
      
      if (enrollmentGrades?.id) {
        // UPDATE existente
        if (r.partial_grade === undefined && r.final_grade === undefined) {
          continue
        }
        
        const updates: any = {}
        
        // Si se edito parcial, actualizar partial_grade y partial_status
        if (r.partial_grade !== undefined) {
          updates.partial_grade = r.partial_grade ?? null
          if (r.partial_grade !== null && r.partial_grade !== undefined) {
            updates.partial_status = r.partial_grade >= 8 ? 'promocionado' : r.partial_grade >= 6 ? 'regular' : 'desaprobado'
          } else {
            updates.partial_status = null
          }
        }
        
        // Si se edito final, actualizar final_grade y final_status
        if (r.final_grade !== undefined) {
          updates.final_grade = r.final_grade ?? null
          if (r.final_grade !== null && r.final_grade !== undefined) {
            updates.final_status = r.final_grade >= 8 ? 'promocionado' : r.final_grade >= 6 ? 'aprobado' : 'desaprobado'
          } else {
            updates.final_status = null
          }
        }
        
        await supabase
          .from('enrollment_grades')
          .update(updates)
          .eq('id', enrollmentGrades.id)
      } else {
        // INSERT nuevo
        const partial = r.partial_grade ?? null
        const final = r.final_grade ?? null
        
        let partialStatus = null
        if (partial !== null && partial !== undefined) {
          partialStatus = partial >= 8 ? 'promocionado' : partial >= 6 ? 'regular' : 'desaprobado'
        }
        
        let finalStatus = null
        if (final !== null && final !== undefined) {
          finalStatus = final >= 8 ? 'promocionado' : final >= 6 ? 'aprobado' : 'desaprobado'
        }
        
        await supabase
          .from('enrollment_grades')
          .insert({
            enrollment_id: r.id,
            partial_grade: partial,
            partial_status: partialStatus,
            final_grade: final,
            final_status: finalStatus,
          })
      }
    }

    alert('Notas guardadas correctamente')
  }

  const deleteGrade = async (index: number) => {
    const r = rows[index]
    const enrollmentGrades = Array.isArray(r.enrollment_grades) ? r.enrollment_grades[0] : r.enrollment_grades
    
    if (!enrollmentGrades?.id) {
      alert('No hay nota para borrar')
      return
    }

    if (confirm('Estas seguro de que quieres borrar esta nota?')) {
      try {
        await supabase
          .from('enrollment_grades')
          .update({
            partial_grade: null,
            partial_status: null,
            final_grade: null,
            final_status: null,
          })
          .eq('id', enrollmentGrades.id)
        
        alert('Nota borrada correctamente')
        void loadStudents(selected)
      } catch (err) {
        alert('Error al borrar la nota: ' + String(err))
      }
    }
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
        <form onSubmit={(e) => { e.preventDefault(); saveAll() }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse border border-gray-200">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-200 px-4 py-2 text-left">Alumno</th>
                <th className="border border-gray-200 px-4 py-2 text-center">Parcial</th>
                <th className="border border-gray-200 px-4 py-2 text-center">Final</th>
                <th className="border border-gray-200 px-4 py-2 text-center">Nota</th>
                <th className="border border-gray-200 px-4 py-2 text-center">Accion</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => {
                const enrollmentGrades = Array.isArray(r.enrollment_grades) ? r.enrollment_grades[0] : r.enrollment_grades
                const final = r.final_grade ?? enrollmentGrades?.partial_grade
                return (
                  <tr key={r.id} className="border-b border-gray-200">
                    <td className="border border-gray-200 px-4 py-2">
                      {r.student?.last_name}, {r.student?.first_name}
                    </td>
                    <td className="border border-gray-200 px-4 py-2">
                      <input
                        type="number"
                        className="w-full px-2 py-1 border border-gray-300 rounded"
                        value={r.partial_grade !== undefined ? r.partial_grade : (enrollmentGrades?.partial_grade ?? '')}
                        onChange={e => updateValue(i, 'partial_grade', e.target.value ? +e.target.value : null)}
                      />
                    </td>
                    <td className="border border-gray-200 px-4 py-2">
                      <input
                        type="number"
                        className="w-full px-2 py-1 border border-gray-300 rounded"
                        value={r.final_grade !== undefined ? r.final_grade : (enrollmentGrades?.final_grade ?? '')}
                        onChange={e => updateValue(i, 'final_grade', e.target.value ? +e.target.value : null)}
                      />
                    </td>
                    <td className="border border-gray-200 px-4 py-2 text-center font-bold">{final ?? '-'}</td>
                    <td className="border border-gray-200 px-4 py-2 text-center">
                      <button
                        onClick={() => deleteGrade(i)}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded text-xs font-semibold transition-colors"
                        title="Borrar nota de este alumno"
                      >
                        <Trash2 size={14} />
                        Borrar
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>

          <button
            type="submit"
            className="mt-4 px-6 py-2 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Guardar todo
          </button>
        </div>
        </form>
      )}
    </div>
  )
}
