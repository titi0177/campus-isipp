import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { DataTable } from '@/components/DataTable'
import { Modal } from '@/components/Modal'
import { useToast } from '@/components/Toast'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import type { Program } from '@/types'

export const Route = createFileRoute('/admin/programs')({
  component: ProgramsPage,
})

function ProgramsPage() {
  const [programs, setPrograms] = useState<Program[]>([])
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Partial<Program>>({})
  const { showToast } = useToast()

  useEffect(() => { load() }, [])

  const load = async () => {
    const { data, error } = await supabase
      .from('programs')
      .select('*')
      .order('name')

    if (error) {
      console.error(error)
      showToast('Error cargando carreras', 'error')
      return
    }

    setPrograms(data || [])
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()

    const { id, created_at, updated_at, ...data } = editing as any

    let error

    if (id) {
      const res = await supabase
        .from('programs')
        .update(data)
        .eq('id', id)

      error = res.error
    } else {
      const res = await supabase
        .from('programs')
        .insert(data)

      error = res.error
    }

    if (error) {
      console.error(error)
      showToast('Error al guardar la carrera', 'error')
      return
    }

    showToast('Carrera guardada')
    setModalOpen(false)
    setEditing({})
    load()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar esta carrera?')) return

    const { error } = await supabase
      .from('programs')
      .delete()
      .eq('id', id)

    if (error) {
      console.error(error)
      showToast('Error al eliminar', 'error')
      return
    }

    showToast('Carrera eliminada', 'info')
    load()
  }

  return (
    <div className="space-y-6">

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Carreras</h1>

        <button
          onClick={() => {
            setEditing({})
            setModalOpen(true)
          }}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={16} /> Nueva Carrera
        </button>
      </div>

      <DataTable
        columns={[
          { key: 'name', label: 'Nombre de la Carrera' },
          { key: 'code', label: 'Código' },
          { key: 'duration_years', label: 'Duración (años)' },
          { key: 'description', label: 'Descripción' },
        ]}
        data={programs as any}
        actions={(row: any) => (
          <div className="flex items-center gap-2 justify-end">

            <button
              onClick={() => {
                setEditing(row)
                setModalOpen(true)
              }}
              className="p-1.5 text-gray-500 hover:text-[#7A1E2C] hover:bg-red-50 rounded-lg"
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
        title={editing.id ? 'Editar Carrera' : 'Nueva Carrera'}
      >

        <form onSubmit={handleSave} className="space-y-4">

          <div>
            <label className="form-label">Nombre *</label>
            <input
              className="form-input"
              required
              value={editing.name || ''}
              onChange={e =>
                setEditing(p => ({ ...p, name: e.target.value }))
              }
            />
          </div>

          <div>
            <label className="form-label">Código *</label>
            <input
              className="form-input"
              required
              value={editing.code || ''}
              onChange={e =>
                setEditing(p => ({ ...p, code: e.target.value }))
              }
            />
          </div>

          <div>
            <label className="form-label">Duración (años) *</label>
            <input
              type="number"
              min={1}
              max={8}
              className="form-input"
              required
              value={editing.duration_years || ''}
              onChange={e =>
                setEditing(p => ({
                  ...p,
                  duration_years: Number(e.target.value)
                }))
              }
            />
          </div>

          <div>
            <label className="form-label">Descripción</label>
            <textarea
              className="form-input"
              rows={3}
              value={editing.description || ''}
              onChange={e =>
                setEditing(p => ({ ...p, description: e.target.value }))
              }
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="submit" className="btn-primary flex-1">
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