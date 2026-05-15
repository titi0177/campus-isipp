import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { DataTable } from '@/components/DataTable'
import { Modal } from '@/components/Modal'
import { useToast } from '@/components/Toast'
import { Plus, Pencil, Trash2 } from 'lucide-react'

export const Route = createFileRoute('/admin/final-exams')({
  component: FinalExamsPage,
})

function FinalExamsPage() {
  const [exams, setExams] = useState<any[]>([])
  const [subjects, setSubjects] = useState<any[]>([])
  const [professors, setProfessors] = useState<any[]>([])
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<any>({})
  const { showToast } = useToast()

  useEffect(() => {
    load()
  }, [])

  async function load() {
    try {
      const examsQuery = supabase
        .from('final_exams')
        .select(`
          *,
          subject:subjects(name, code)
        `)
        .order('exam_date', { ascending: false })

      const subjectsQuery = supabase
        .from('subjects')
        .select('id, name, code')
        .order('name')

      const professorsQuery = supabase
        .from('professors')
        .select('id, name')
        .order('name')

      const [{ data: examsData, error: examsError },
             { data: subjectsData },
             { data: professorsData }] = await Promise.all([
        examsQuery,
        subjectsQuery,
        professorsQuery
      ])

      if (examsError) {
        console.error(examsError)
        showToast(examsError.message, 'error')
        return
      }

      setExams(examsData || [])
      setSubjects(subjectsData || [])
      setProfessors(professorsData || [])

    } catch (err) {
      console.error(err)
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()

    const { id, created_at, subject, professor, president, vocal1, vocal2, date, exam_date, exam_time, ...rest } = editing
    const when = exam_date ?? date
    const payload: Record<string, unknown> = {
      ...rest,
      exam_date: when,
      exam_time: editing.exam_time || '09:00',
      president_id: editing.president_id || null,
      vocal1_id: editing.vocal1_id || null,
      vocal2_id: editing.vocal2_id || null,
    }
    delete payload.date

    let res

    if (id) {
      res = await supabase
        .from('final_exams')
        .update(payload)
        .eq('id', id)
    } else {
      res = await supabase
        .from('final_exams')
        .insert(payload)
    }

    if (res.error) {
      console.error(res.error)
      showToast(res.error.message, 'error')
      return
    }

    showToast('Mesa de examen guardada.')
    setModalOpen(false)
    setEditing({})
    await load()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar esta mesa de examen?')) return

    const { error } = await supabase
      .from('final_exams')
      .delete()
      .eq('id', id)

    if (error) {
      showToast(error.message, 'error')
      return
    }

    showToast('Mesa eliminada.', 'info')
    load()
  }

  return (
    <div className="space-y-6">

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">
          Exámenes Finales
        </h1>

        <button
          onClick={() => {
            setEditing({ location: '', exam_time: '09:00' })
            setModalOpen(true)
          }}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={16} />
          Nueva Mesa
        </button>
      </div>

      <DataTable
        columns={[
          {
            key: 'subject',
            label: 'Materia',
            render: (r: any) => r.subject?.name
          },
          {
            key: 'code',
            label: 'Código',
            render: (r: any) => r.subject?.code
          },
          {
            key: 'exam_date',
            label: 'Fecha',
            render: (r: any) => {
              const d = r.exam_date ?? r.date
              return d ? new Date(d).toLocaleDateString('es-AR') : '-'
            }
          },
          {
            key: 'exam_time',
            label: 'Hora',
            render: (r: any) => r.exam_time || '-'
          },
          {
            key: 'location',
            label: 'Lugar'
          },
        ]}
        data={exams}
        actions={(row: any) => (
          <div className="flex items-center gap-2 justify-end">

            <button
              onClick={() => {
                setEditing(row)
                setModalOpen(true)
              }}
              className="siu-table-action"
            >
              <Pencil size={15} />
            </button>

            <button
              onClick={() => handleDelete(row.id)}
              className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg"
            >
              <Trash2 size={15} />
            </button>

          </div>
        )}
      />

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing.id ? 'Editar Mesa' : 'Nueva Mesa de Examen'}
      >

        <form onSubmit={handleSave} className="space-y-4">

          <div>
            <label className="form-label">Materia *</label>
            <select
              className="form-input"
              required
              value={editing.subject_id || ''}
              onChange={e =>
                setEditing((p: any) => ({
                  ...p,
                  subject_id: e.target.value
                }))
              }
            >
              <option value="">Seleccionar...</option>
              {subjects.map(s => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.code})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">

            <div>
              <label className="form-label">Fecha *</label>
              <input
                type="date"
                className="form-input"
                required
                value={editing.date ?? editing.exam_date ?? ''}
                onChange={e =>
                  setEditing((p: any) => ({
                    ...p,
                    date: e.target.value,
                    exam_date: e.target.value,
                  }))
                }
              />
            </div>

            <div>
              <label className="form-label">Horario *</label>
              <input
                type="time"
                className="form-input"
                required
                value={editing.exam_time || '09:00'}
                onChange={e =>
                  setEditing((p: any) => ({
                    ...p,
                    exam_time: e.target.value
                  }))
                }
              />
            </div>

          </div>

          <div className="grid grid-cols-2 gap-4">

            <div>
              <label className="form-label">Lugar *</label>
              <input
                className="form-input"
                required
                value={editing.location || ''}
                onChange={e =>
                  setEditing((p: any) => ({
                    ...p,
                    location: e.target.value
                  }))
                }
              />
            </div>

            <div>
              <label className="form-label">Cupos máximos</label>
              <input
                type="number"
                min={1}
                className="form-input"
                value={editing.max_students || ''}
                onChange={e =>
                  setEditing((p: any) => ({
                    ...p,
                    max_students: e.target.value === '' ? null : +e.target.value
                  }))
                }
                placeholder="Sin límite"
              />
            </div>

          </div>

          <div className="space-y-3 border-t pt-4">
            <h3 className="font-semibold text-gray-900">Composición de Mesa</h3>

            <div>
              <label className="form-label">Presidente de Mesa *</label>
              <select
                className="form-input"
                required
                value={editing.president_id || ''}
                onChange={e =>
                  setEditing((p: any) => ({
                    ...p,
                    president_id: e.target.value
                  }))
                }
              >
                <option value="">Seleccionar...</option>
                {professors.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="form-label">Vocal 1</label>
              <select
                className="form-input"
                value={editing.vocal1_id || ''}
                onChange={e =>
                  setEditing((p: any) => ({
                    ...p,
                    vocal1_id: e.target.value
                  }))
                }
              >
                <option value="">Sin asignar</option>
                {professors.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="form-label">Vocal 2</label>
              <select
                className="form-input"
                value={editing.vocal2_id || ''}
                onChange={e =>
                  setEditing((p: any) => ({
                    ...p,
                    vocal2_id: e.target.value
                  }))
                }
              >
                <option value="">Sin asignar</option>
                {professors.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

          </div>

          <div className="flex gap-3 pt-2">

            <button
              type="submit"
              className="btn-primary flex-1"
            >
              Guardar
            </button>

            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="btn-secondary flex-1"
            >
              Cancelar
            </button>

          </div>

        </form>

      </Modal>

    </div>
  )
}
