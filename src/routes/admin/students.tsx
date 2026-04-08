import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { DataTable } from '@/components/DataTable'
import { Modal } from '@/components/Modal'
import { useToast } from '@/components/Toast'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import type { Student, Program } from '@/types'
import { Link } from '@tanstack/react-router'

export const Route = createFileRoute('/admin/students')({
  component: StudentsPage,
})

const EMPTY: Partial<Student> = { first_name: '', last_name: '', dni: '', legajo: '', email: '', year: 1, status: 'active' }

function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([])
  const [programs, setPrograms] = useState<Program[]>([])
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Partial<Student>>(EMPTY)
  const [loading, setLoading] = useState(true)
  const { showToast } = useToast()

  useEffect(() => { loadData() }, [])

  async function loadData() {
    const [{ data: s }, { data: p }] = await Promise.all([
      supabase.from('students').select('*, program:programs(name)').order('last_name'),
      supabase.from('programs').select('*'),
    ])
    setStudents(s || [])
    setPrograms(p || [])
    setLoading(false)
  }

  const openNew = () => { setEditing(EMPTY); setModalOpen(true) }
  const openEdit = (s: Student) => { setEditing(s); setModalOpen(true) }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    const { id, program, ...data } = editing as any
    if (id) {
      const { error } = await supabase.from('students').update(data).eq('id', id)
      if (error) { showToast('Error al actualizar.', 'error'); return }
      showToast('Estudiante actualizado.')
    } else {
      const { error } = await supabase.from('students').insert(data)
      if (error) { showToast('Error al crear estudiante.', 'error'); return }
      showToast('Estudiante creado.')
    }
    setModalOpen(false)
    loadData()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este estudiante?')) return
    await supabase.from('students').delete().eq('id', id)
    showToast('Estudiante eliminado.', 'info')
    loadData()
  }

  const columns = [
    { key: 'last_name', label: 'Apellido' },
    { key: 'first_name', label: 'Nombre' },
    { key: 'legajo', label: 'Legajo' },
    { key: 'dni', label: 'DNI' },
    { key: 'email', label: 'Email' },
    { key: 'program', label: 'Carrera', render: (r: any) => r.program?.name || '-' },
    { key: 'year', label: 'Año' },
    { key: 'status', label: 'Estado', render: (r: any) => <span className="capitalize">{r.status}</span> },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Estudiantes</h1>
          <p className="text-gray-500 text-sm mt-1">Gestión del padrón de alumnos</p>
        </div>
        <button onClick={openNew} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Nuevo Estudiante
        </button>
      </div>

      {loading ? <div className="card animate-pulse h-64 bg-gray-100" /> : (
        <DataTable
          columns={columns}
          data={students as any}
          searchPlaceholder="Buscar por nombre, legajo, DNI..."
          actions={(row: any) => (
            <div className="flex items-center gap-2 justify-end">
              <Link
  to="/admin/student-record/$id"
  params={{ id: row.id }}
  className="text-blue-600"
>
Historial
</Link>
              <button onClick={() => openEdit(row)} className="p-1.5 text-gray-500 hover:text-[#7A1E2C] hover:bg-red-50 rounded-lg transition-colors">
                <Pencil size={15} />
              </button>
              <button onClick={() => handleDelete(row.id)} className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                <Trash2 size={15} />
              </button>
            </div>
          )}
        />
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing.id ? 'Editar Estudiante' : 'Nuevo Estudiante'}>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Nombre *</label>
              <input className="form-input" required value={editing.first_name || ''} onChange={e => setEditing(p => ({ ...p, first_name: e.target.value }))} />
            </div>
            <div>
              <label className="form-label">Apellido *</label>
              <input className="form-input" required value={editing.last_name || ''} onChange={e => setEditing(p => ({ ...p, last_name: e.target.value }))} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">DNI *</label>
              <input className="form-input" required value={editing.dni || ''} onChange={e => setEditing(p => ({ ...p, dni: e.target.value }))} />
            </div>
            <div>
              <label className="form-label">Legajo *</label>
              <input className="form-input" required value={editing.legajo || ''} onChange={e => setEditing(p => ({ ...p, legajo: e.target.value }))} />
            </div>
          </div>
          <div>
            <label className="form-label">Email *</label>
            <input type="email" className="form-input" required value={editing.email || ''} onChange={e => setEditing(p => ({ ...p, email: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Carrera</label>
              <select className="form-input" value={editing.program_id || ''} onChange={e => setEditing(p => ({ ...p, program_id: e.target.value }))}>
                <option value="">Sin asignar</option>
                {programs.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Año</label>
              <input type="number" min={1} max={6} className="form-input" value={editing.year || 1} onChange={e => setEditing(p => ({ ...p, year: +e.target.value }))} />
            </div>
          </div>
          <div>
            <label className="form-label">Estado</label>
            <select className="form-input" value={editing.status || 'active'} onChange={e => setEditing(p => ({ ...p, status: e.target.value as any }))}>
              <option value="active">Activo</option>
              <option value="inactive">Inactivo</option>
              <option value="graduated">Egresado</option>
              <option value="suspended">Suspendido</option>
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" className="btn-primary flex-1">Guardar</button>
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary flex-1">Cancelar</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
