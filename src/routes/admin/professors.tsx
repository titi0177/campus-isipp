import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { DataTable } from '@/components/DataTable'
import { Modal } from '@/components/Modal'
import { useToast } from '@/components/Toast'
import { Plus, Pencil, Trash2, Filter } from 'lucide-react'
import type { Professor } from '@/types'
import { provisionProfessorWithAuth } from '@/server/provisionAuthUsers'

export const Route = createFileRoute('/admin/professors')({
  component: ProfessorsPage,
})

function ProfessorsPage() {
  const [allProfessors, setAllProfessors] = useState<Professor[]>([])
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Partial<Professor & { dni?: string }>>({})
  const [createWithAuth, setCreateWithAuth] = useState(true)
  const [saving, setSaving] = useState(false)
  const { showToast } = useToast()

  // Filtros
  const [filterSearch, setFilterSearch] = useState<string>('')
  const [filterDepartment, setFilterDepartment] = useState<string>('')
  const [filterStatus, setFilterStatus] = useState<string>('')

  useEffect(() => {
    void load()
  }, [])

  const load = async () => {
    const { data } = await supabase.from('professors').select('*').order('name')
    setAllProfessors(data || [])
  }

  const departments = Array.from(
    new Set(allProfessors.map(p => p.department).filter(Boolean))
  ).sort()

  const filteredProfessors = allProfessors.filter(p => {
    // Filtro por búsqueda (nombre, email)
    if (filterSearch) {
      const search = filterSearch.toLowerCase()
      return (
        p.name?.toLowerCase().includes(search) ||
        p.email?.toLowerCase().includes(search)
      )
    }
    
    // Filtro por departamento
    if (filterDepartment && p.department !== filterDepartment) return false
    
    // Filtro por estado (con cuenta o sin)
    if (filterStatus === 'with_account' && !p.user_id) return false
    if (filterStatus === 'without_account' && p.user_id) return false
    
    return true
  })

  const openNew = () => {
    setEditing({})
    setCreateWithAuth(true)
    setModalOpen(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    const { id, created_at, dni, ...data } = editing as any

    if (id) {
      const { error } = await supabase
        .from('professors')
        .update({
          name: data.name,
          email: data.email,
          department: data.department,
        })
        .eq('id', id)
      if (error) {
        showToast(error.message, 'error')
        return
      }
      showToast('Profesor guardado.')
      setModalOpen(false)
      void load()
      return
    }

    if (createWithAuth) {
      if (!dni?.trim()) {
        showToast('Ingresá el DNI para generar la contraseña inicial.', 'error')
        return
      }
      setSaving(true)
      const { data: sessionData } = await supabase.auth.getSession()
      const token = sessionData.session?.access_token
      if (!token) {
        showToast('Sesión expirada. Volvé a iniciar sesión.', 'error')
        setSaving(false)
        return
      }

      const res = await provisionProfessorWithAuth({
        data: {
          accessToken: token,
          email: data.email,
          dni: String(dni).trim(),
          name: data.name,
          department: data.department,
        },
      })

      setSaving(false)

      if (!res.ok) {
        showToast(res.message, 'error')
        return
      }

      showToast(
        'Profesor creado con acceso al portal docente. Usuario: correo · Contraseña inicial: DNI (solo números).',
        'info',
      )
      setModalOpen(false)
      void load()
      return
    }

    const { error } = await supabase.from('professors').insert(data)
    if (error) {
      showToast(error.message, 'error')
      return
    }
    showToast('Profesor guardado (sin cuenta de acceso).')
    setModalOpen(false)
    void load()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este profesor?')) return
    await supabase.from('professors').delete().eq('id', id)
    showToast('Profesor eliminado.', 'info')
    void load()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Profesores</h1>
          <p className="mt-1 text-sm text-gray-500">Docentes y acceso al módulo /professor ({filteredProfessors.length} resultados)</p>
        </div>
        <button type="button" onClick={openNew} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Nuevo profesor
        </button>
      </div>

      {/* Filtros */}
      <div className="card p-4 space-y-3">
        <div className="flex items-center gap-2 mb-3">
          <Filter size={18} className="text-slate-600" />
          <h3 className="font-semibold text-slate-900">Filtros</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className="form-label text-xs">Buscar</label>
            <input 
              type="text"
              placeholder="Nombre, email..."
              className="form-input text-sm"
              value={filterSearch}
              onChange={(e) => setFilterSearch(e.target.value)}
            />
          </div>
          <div>
            <label className="form-label text-xs">Por Departamento</label>
            <select 
              className="form-input text-sm"
              value={filterDepartment}
              onChange={(e) => setFilterDepartment(e.target.value)}
            >
              <option value="">Todos</option>
              {departments.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label text-xs">Por Acceso</label>
            <select 
              className="form-input text-sm"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="">Todos</option>
              <option value="with_account">Con cuenta</option>
              <option value="without_account">Sin cuenta</option>
            </select>
          </div>
          <div>
            <label className="form-label text-xs">&nbsp;</label>
            <button
              type="button"
              onClick={() => {
                setFilterSearch('')
                setFilterDepartment('')
                setFilterStatus('')
              }}
              className="btn-secondary w-full text-sm"
            >
              Limpiar
            </button>
          </div>
        </div>
      </div>

      <DataTable
        columns={[
          { key: 'name', label: 'Nombre' },
          { key: 'email', label: 'Email' },
          { key: 'department', label: 'Departamento' },
          {
            key: 'user_id',
            label: 'Portal',
            render: (r: any) =>
              r.user_id ? (
                <span className="rounded bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-800">
                  Vinculado
                </span>
              ) : (
                <span className="text-xs text-slate-400">Sin cuenta</span>
              ),
          },
        ]}
        data={filteredProfessors as any}
        actions={(row: any) => (
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setEditing(row)
                setModalOpen(true)
              }}
              className="siu-table-action"
            >
              <Pencil size={15} />
            </button>
            <button
              type="button"
              onClick={() => void handleDelete(row.id)}
              className="rounded-lg p-1.5 text-gray-500 hover:bg-red-50 hover:text-red-600"
            >
              <Trash2 size={15} />
            </button>
          </div>
        )}
      />

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing.id ? 'Editar profesor' : 'Nuevo profesor'}
      >
        <form onSubmit={(e) => void handleSave(e)} className="space-y-4">
          {!editing.id && (
            <div className="rounded-lg border border-amber-200 bg-amber-50/80 p-3 text-sm text-amber-950">
              <label className="flex cursor-pointer items-start gap-2">
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={createWithAuth}
                  onChange={(e) => setCreateWithAuth(e.target.checked)}
                />
                <span>
                  <strong>Crear cuenta en Supabase Auth</strong> para el portal docente.{' '}
                  <strong>Correo</strong> = usuario · <strong>DNI (números)</strong> = contraseña inicial (mín. 6
                  dígitos).
                </span>
              </label>
            </div>
          )}

          <div>
            <label className="form-label">Nombre completo *</label>
            <input
              className="form-input"
              required
              value={editing.name || ''}
              onChange={(e) => setEditing((p) => ({ ...p, name: e.target.value }))}
            />
          </div>
          <div>
            <label className="form-label">Email * {!editing.id && createWithAuth && '(usuario de acceso)'}</label>
            <input
              type="email"
              className="form-input"
              required
              value={editing.email || ''}
              onChange={(e) => setEditing((p) => ({ ...p, email: e.target.value }))}
            />
          </div>
          {!editing.id && createWithAuth && (
            <div>
              <label className="form-label">DNI * (contraseña inicial)</label>
              <input
                className="form-input"
                required={createWithAuth}
                value={(editing as any).dni || ''}
                onChange={(e) => setEditing((p) => ({ ...p, dni: e.target.value }))}
                placeholder="Solo números, mínimo 6"
              />
            </div>
          )}
          <div>
            <label className="form-label">Departamento *</label>
            <input
              className="form-input"
              required
              value={editing.department || ''}
              onChange={(e) => setEditing((p) => ({ ...p, department: e.target.value }))}
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" className="btn-primary flex-1" disabled={saving}>
              {saving ? 'Creando…' : 'Guardar'}
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
