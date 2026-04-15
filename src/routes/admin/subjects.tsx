import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { DataTable } from '@/components/DataTable'
import { Modal } from '@/components/Modal'
import { useToast } from '@/components/Toast'
import { Plus, Pencil, Trash2, Filter } from 'lucide-react'
import type { Subject, Program, Professor } from '@/types'

export const Route = createFileRoute('/admin/subjects')({
  component: SubjectsPage,
})

function SubjectsPage() {
  const [allSubjects, setAllSubjects] = useState<Subject[]>([])
  const [programs, setPrograms] = useState<Program[]>([])
  const [professors, setProfessors] = useState<Professor[]>([])
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Partial<Subject>>({})
  const { showToast } = useToast()

  // Filtros
  const [filterYear, setFilterYear] = useState<number | null>(null)
  const [filterProgram, setFilterProgram] = useState<string>('')
  const [filterDictation, setFilterDictation] = useState<string>('')
  const [filterSearch, setFilterSearch] = useState<string>('')

  useEffect(() => { load() }, [])

  async function load() {
    const [{ data: s }, { data: p }, { data: pr }] = await Promise.all([
      supabase.from('subjects').select('*, program:programs(name), professor:professors(name)').order('name'),
      supabase.from('programs').select('*').order('name'),
      supabase.from('professors').select('*').order('name'),
    ])
    setAllSubjects(s || [])
    setPrograms(p || [])
    setProfessors(pr || [])
  }

  const filteredSubjects = allSubjects.filter(s => {
    // Filtro por año
    if (filterYear !== null && s.year !== filterYear) return false
    
    // Filtro por programa
    if (filterProgram && (s as any).program_id !== filterProgram) return false
    
    // Filtro por tipo de dictado
    if (filterDictation && s.dictation_type !== filterDictation) return false
    
    // Filtro por búsqueda (nombre, código)
    if (filterSearch) {
      const search = filterSearch.toLowerCase()
      return (
        s.name?.toLowerCase().includes(search) ||
        s.code?.toLowerCase().includes(search)
      )
    }
    
    return true
  })

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    const { id, created_at, program, professor, ...data } = editing as any
    if (id) await supabase.from('subjects').update(data).eq('id', id)
    else await supabase.from('subjects').insert(data)
    showToast('Materia guardada.'); setModalOpen(false); load()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar esta materia?')) return
    await supabase.from('subjects').delete().eq('id', id)
    showToast('Materia eliminada.', 'info'); load()
  }

  const getDictationLabel = (row: any) => {
    if (row.dictation_type === 'cuatrimestral') {
      return `${row.semester === 1 ? '1er' : '2do'} C.`
    }
    return 'Anual'
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Materias</h1>
          <p className="mt-1 text-sm text-gray-500">Gestión de asignaturas ({filteredSubjects.length} resultados)</p>
        </div>
        <button onClick={() => { setEditing({ year: 1, credits: 4, allows_promotion: false, dictation_type: 'anual', semester: 1 }); setModalOpen(true) }} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Nueva Materia
        </button>
      </div>

      {/* Filtros */}
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
              placeholder="Nombre, código..."
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
            <label className="form-label text-xs">Por Dictado</label>
            <select 
              className="form-input text-sm"
              value={filterDictation}
              onChange={(e) => setFilterDictation(e.target.value)}
            >
              <option value="">Todos</option>
              <option value="anual">Anual</option>
              <option value="cuatrimestral">Cuatrimestral</option>
            </select>
          </div>
          <div>
            <label className="form-label text-xs">&nbsp;</label>
            <button
              type="button"
              onClick={() => {
                setFilterYear(null)
                setFilterProgram('')
                setFilterDictation('')
                setFilterSearch('')
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
          { key: 'code', label: 'Código' },
          { key: 'name', label: 'Nombre' },
          { key: 'program', label: 'Carrera', render: (r: any) => r.program?.name || '-' },
          { key: 'year', label: 'Año' },
          { key: 'dictation_type', label: 'Dictado', render: (r: any) => getDictationLabel(r) },
          { key: 'professor', label: 'Profesor', render: (r: any) => r.professor?.name || '-' },
          { key: 'credits', label: 'Créditos' },
          { key: 'allows_promotion', label: 'Promocional', render: (r: any) => r.allows_promotion ? '✓' : '-' },
          { key: 'division', label: 'División', render: (r: any) => r.division ? `Div. ${r.division}` : '-' },
        ]}
        data={filteredSubjects as any}
        actions={(row: any) => (
          <div className="flex items-center gap-2 justify-end">
            <button onClick={() => { setEditing(row); setModalOpen(true) }} className="siu-table-action"><Pencil size={15} /></button>
            <button onClick={() => handleDelete(row.id)} className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={15} /></button>
          </div>
        )}
      />

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing.id ? 'Editar Materia' : 'Nueva Materia'}>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Nombre *</label>
              <input className="form-input" required value={editing.name || ''} onChange={e => setEditing(p => ({ ...p, name: e.target.value }))} />
            </div>
            <div>
              <label className="form-label">Código *</label>
              <input className="form-input" required value={editing.code || ''} onChange={e => setEditing(p => ({ ...p, code: e.target.value }))} />
            </div>
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Tipo de Dictado</label>
              <select 
                className="form-input" 
                value={editing.dictation_type || 'anual'} 
                onChange={e => setEditing(p => ({ ...p, dictation_type: e.target.value }))}
              >
                <option value="anual">Anual</option>
                <option value="cuatrimestral">Cuatrimestral</option>
              </select>
            </div>
            <div>
              <label className="form-label">
                {(editing as any).dictation_type === 'cuatrimestral' ? 'Cuatrimestre' : 'Semestre'}
              </label>
              <select 
                className="form-input" 
                value={editing.semester || 1} 
                onChange={e => setEditing(p => ({ ...p, semester: +e.target.value }))}
                disabled={(editing as any).dictation_type === 'anual'}
              >
                <option value={1}>{(editing as any).dictation_type === 'cuatrimestral' ? '1er Cuatrimestre' : 'Primer Semestre'}</option>
                <option value={2}>{(editing as any).dictation_type === 'cuatrimestral' ? '2do Cuatrimestre' : 'Segundo Semestre'}</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Profesor</label>
              <select className="form-input" value={editing.professor_id || ''} onChange={e => setEditing(p => ({ ...p, professor_id: e.target.value }))}>
                <option value="">Sin asignar</option>
                {professors.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Créditos</label>
              <input type="number" min={1} className="form-input" value={editing.credits || 4} onChange={e => setEditing(p => ({ ...p, credits: +e.target.value }))} />
            </div>
            <div>
              <label className="form-label">División (Año 1)</label>
              <select className="form-input" value={editing.division || ''} onChange={e => setEditing(p => ({ ...p, division: e.target.value || null }))} disabled={(editing as any).year !== 1}>
                <option value="">Sin división</option>
                <option value="A">División A</option>
                <option value="B">División B</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="allows_promotion"
              className="rounded border-gray-300"
              checked={editing.allows_promotion || false}
              onChange={e => setEditing(p => ({ ...p, allows_promotion: e.target.checked }))}
            />
            <label htmlFor="allows_promotion" className="form-label mb-0 cursor-pointer">
              Permite promoción (mostrar "Promocionado" si cumple requisitos)
            </label>
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
