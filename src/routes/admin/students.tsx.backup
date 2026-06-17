import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { DataTable } from '@/components/DataTable'
import { Modal } from '@/components/Modal'
import { useToast } from '@/components/Toast'
import { Plus, Pencil, Trash2, Filter } from 'lucide-react'
import type { Student, Program } from '@/types'
import { Link } from '@tanstack/react-router'

export const Route = createFileRoute('/admin/students')({
  component: StudentsPage,
})

const EMPTY: Partial<Student> = { first_name: '', last_name: '', dni: '', legajo: '', email: '', year: 1, status: 'active' }

function StudentsPage() {
  const [allStudents, setAllStudents] = useState<Student[]>([])
  const [programs, setPrograms] = useState<Program[]>([])
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Partial<Student>>(EMPTY)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const { showToast } = useToast()

  const [filterYear, setFilterYear] = useState<number | null>(null)
  const [filterProgram, setFilterProgram] = useState<string>('')
  const [filterStatus, setFilterStatus] = useState<string>('')
  const [filterSearch, setFilterSearch] = useState<string>('')

  useEffect(() => {
    void loadData()
  }, [])

  async function loadData() {
    const [{ data: s }, { data: p }] = await Promise.all([
      supabase.from('students').select('*, program:programs(name)').order('last_name'),
      supabase.from('programs').select('*'),
    ])
    setAllStudents(s || [])
    setPrograms(p || [])
    setLoading(false)
  }

  const filteredStudents = allStudents.filter(s => {
    if (filterYear !== null && s.year !== filterYear) return false
    if (filterProgram && (s as any).program_id !== filterProgram) return false
    if (filterStatus && s.status !== filterStatus) return false
    if (filterSearch) {
      const search = filterSearch.toLowerCase()
      return (
        s.first_name?.toLowerCase().includes(search) ||
        s.last_name?.toLowerCase().includes(search) ||
        s.legajo?.toLowerCase().includes(search) ||
        s.dni?.toLowerCase().includes(search) ||
        s.email?.toLowerCase().includes(search)
      )
    }
    return true
  })

  const openNew = () => {
    setEditing(EMPTY)
    setModalOpen(true)
  }
  const openEdit = (s: Student) => {
    setEditing(s)
    setModalOpen(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    const { id, program, ...rest } = editing as any
    setSaving(true)

    if (id) {
      const { error } = await supabase.from('students').update(rest).eq('id', id)
      setSaving(false)
      if (error) {
        showToast('Error al actualizar.', 'error')
        return
      }
      showToast('Estudiante actualizado.')
      setModalOpen(false)
      void loadData()
      return
    }

    const { error } = await supabase.from('students').insert(rest)
    setSaving(false)
    if (error) {
      showToast('Error al crear estudiante.', 'error')
      return
    }
    showToast('Estudiante creado.')
    setModalOpen(false)
    void loadData()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este estudiante?')) return
    await supabase.from('students').delete().eq('id', id)
    showToast('Estudiante eliminado.', 'info')
    void loadData()
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
          <p className="mt-1 text-sm text-gray-500">Gestión del padrón de alumnos ({filteredStudents.length} resultados)</p>
        </div>
        <button type="button" onClick={openNew} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Nuevo estudiante
        </button>
      </div>

      <div className="card p-4 space-y-3">
        <div className="flex items-center gap-2 mb-3">
          <Filter size={18} className="text-slate-600" />
          <h3 className="font-semibold text-slate-900">Filtros</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div>
            <label className="form-label text-xs">Buscar</label>
            <input 
              type="text"
              placeholder="Nombre, legajo, DNI..."
              className="form-input text-sm"
              value={filterSearch}
              onChange={(e) => setFilterSearch(e.target.value)}
            />
          </div>
          <div>
            <label className="form-label text-xs">Por Año</label>
            <select 
              className="form-input text-sm"
              value={filterYear === null ? '' : filterYear}
              onChange={(e) => setFilterYear(e.target.value ? parseInt(e.target.value) : null)}
            >
              <option value="">Todos</option>
              {[1, 2, 3, 4, 5, 6].map(y => <option key={y} value={y}>{y}° Año</option>)}
            </select>
          </div>
          <div>
            <label className="form-label text-xs">Por Carrera</label>
            <select 
              className="form-input text-sm"
              value={filterProgram}
              onChange={(e) => setFilterProgram(e.target.value)}
            >
              <option value="">Todas</option>
              {programs.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label text-xs">Por Estado</label>
            <select 
              className="form-input text-sm"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="">Todos</option>
              <option value="active">Activo</option>
              <option value="inactive">Inactivo</option>
              <option value="graduated">Egresado</option>
              <option value="suspended">Suspendido</option>
            </select>
          </div>
          <div>
            <label className="form-label text-xs">&nbsp;</label>
            <button
              type="button"
              onClick={() => {
                setFilterYear(null)
                setFilterProgram('')
                setFilterStatus('')
                setFilterSearch('')
              }}
              className="btn-secondary w-full text-sm"
            >
              Limpiar
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="card h-64 animate-pulse bg-gray-100" />
      ) : (
        <DataTable
          columns={columns}
          data={filteredStudents as any}
          searchPlaceholder="Buscar en resultados..."
          actions={(row: any) => (
            <div className="flex items-center justify-end gap-2">
              <Link to="/admin/student-record/$id" params={{ id: row.id }} className="text-blue-600">
                Historial
              </Link>
              <button type="button" onClick={() => openEdit(row)} className="siu-table-action">
                <Pencil size={15} />
              </button>
              <button
                type="button"
                onClick={() => void handleDelete(row.id)}
                className="rounded-lg p-1.5 text-gray-500 transition-colors hover:bg-red-50 hover:text-red-600"
              >
                <Trash2 size={15} />
              </button>
            </div>
          )}
        />
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing.id ? 'Editar estudiante' : 'Nuevo estudiante'}
      >
        <form onSubmit={(e) => void handleSave(e)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Nombre *</label>
              <input
                className="form-input"
                required
                value={editing.first_name || ''}
                onChange={(e) => setEditing((p) => ({ ...p, first_name: e.target.value }))}
              />
            </div>
            <div>
              <label className="form-label">Apellido *</label>
              <input
                className="form-input"
                required
                value={editing.last_name || ''}
                onChange={(e) => setEditing((p) => ({ ...p, last_name: e.target.value }))}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">DNI *</label>
              <input
                className="form-input"
                required
                value={editing.dni || ''}
                onChange={(e) => setEditing((p) => ({ ...p, dni: e.target.value }))}
                placeholder="Solo números recomendado"
              />
            </div>
            <div>
              <label className="form-label">Legajo *</label>
              <input
                className="form-input"
                required
                value={editing.legajo || ''}
                onChange={(e) => setEditing((p) => ({ ...p, legajo: e.target.value }))}
              />
            </div>
          </div>
          <div>
            <label className="form-label">Correo institucional *</label>
            <input
              type="email"
              className="form-input"
              required
              value={editing.email || ''}
              onChange={(e) => setEditing((p) => ({ ...p, email: e.target.value }))}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Carrera</label>
              <select
                className="form-input"
                value={editing.program_id || ''}
                onChange={(e) => setEditing((p) => ({ ...p, program_id: e.target.value }))}
              >
                <option value="">Sin asignar</option>
                {programs.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="form-label">Año</label>
              <input
                type="number"
                min={1}
                max={6}
                className="form-input"
                value={editing.year || 1}
                onChange={(e) => setEditing((p) => ({ ...p, year: +e.target.value }))}
              />
            </div>
          </div>
          <div>
            <label className="form-label">Estado</label>
            <select
              className="form-input"
              value={editing.status || 'active'}
              onChange={(e) => setEditing((p) => ({ ...p, status: e.target.value as any }))}
            >
              <option value="active">Activo</option>
              <option value="inactive">Inactivo</option>
              <option value="graduated">Egresado</option>
              <option value="suspended">Suspendido</option>
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" className="btn-primary flex-1" disabled={saving}>
              {saving ? 'Guardando…' : 'Guardar'}
            </button>
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary flex-1">
              Cancelar
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
