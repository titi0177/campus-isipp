import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { DataTable } from '@/components/DataTable'
import { Modal } from '@/components/Modal'
import { useToast } from '@/components/Toast'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import type { Announcement } from '@/types'

export const Route = createFileRoute('/admin/announcements')({
  component: AnnouncementsAdminPage,
})

function AnnouncementsAdminPage() {
  const [items, setItems] = useState<Announcement[]>([])
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Partial<Announcement>>({})
  const { showToast } = useToast()

  useEffect(() => { load() }, [])

  const load = async () => {
    const { data } = await supabase.from('announcements').select('*').order('date', { ascending: false })
    setItems(data || [])
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    const { id, created_at, ...data } = editing as any
    try {
      if (id) {
        await supabase.from('announcements').update(data).eq('id', id)
      } else {
        await supabase.from('announcements').insert(data)
      }
      showToast('Anuncio guardado.', 'success')
      setModalOpen(false)
      load()
    } catch (error: any) {
      console.error('Error saving announcement:', error)
      showToast(`Error: ${error.message || 'No se pudo guardar'}`, 'error')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este anuncio?')) return
    try {
      await supabase.from('announcements').delete().eq('id', id)
      showToast('Anuncio eliminado.', 'info')
      load()
    } catch (error: any) {
      console.error('Error deleting announcement:', error)
      showToast(`Error: ${error.message || 'No se pudo eliminar'}`, 'error')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Anuncios</h1>
        <button 
          onClick={() => { 
            setEditing({ 
              title: '',
              description: '',
              date: new Date().toISOString().slice(0, 10) 
            })
            setModalOpen(true) 
          }} 
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={16} /> Nuevo Anuncio
        </button>
      </div>

      <DataTable
        columns={[
          { key: 'title', label: 'Título' },
          { key: 'description', label: 'Descripción', render: (r: any) => <span className="line-clamp-1">{r.description}</span> },
          { key: 'date', label: 'Fecha', render: (r: any) => new Date(r.date).toLocaleDateString('es-AR') },
        ]}
        data={items as any}
        actions={(row: any) => (
          <div className="flex items-center gap-2 justify-end">
            <button 
              onClick={() => { 
                setEditing(row)
                setModalOpen(true) 
              }} 
              className="siu-table-action"
              title="Editar"
            >
              <Pencil size={15} />
            </button>
            <button 
              onClick={() => handleDelete(row.id)} 
              className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Eliminar"
            >
              <Trash2 size={15} />
            </button>
          </div>
        )}
      />

      <Modal 
        open={modalOpen} 
        onClose={() => setModalOpen(false)} 
        title={editing.id ? 'Editar Anuncio' : 'Nuevo Anuncio'}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="form-label">Título *</label>
            <input 
              className="form-input" 
              required 
              value={editing.title || ''} 
              onChange={e => setEditing(p => ({ ...p, title: e.target.value }))}
              placeholder="Ej: Clausura de inscripciones"
            />
          </div>
          <div>
            <label className="form-label">Descripción *</label>
            <textarea 
              className="form-input" 
              rows={4} 
              required 
              value={editing.description || ''} 
              onChange={e => setEditing(p => ({ ...p, description: e.target.value }))}
              placeholder="Escribe el contenido del anuncio"
            />
          </div>
          <div>
            <label className="form-label">Fecha *</label>
            <input 
              type="date" 
              className="form-input" 
              required 
              value={editing.date || ''} 
              onChange={e => setEditing(p => ({ ...p, date: e.target.value }))}
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" className="btn-primary flex-1">Publicar</button>
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
