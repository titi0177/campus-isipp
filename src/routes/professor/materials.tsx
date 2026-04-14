import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/components/Toast'
import { Upload, Trash2, Download, Loader } from 'lucide-react'

export const Route = createFileRoute('/professor/materials')({
  component: ProfessorMaterialsPage,
})

type Material = {
  id: string
  title: string
  description?: string
  file_name: string
  file_url: string
  file_type?: string
  file_size?: number
  created_at: string
  subject: { id: string; name: string; code: string }
}

function ProfessorMaterialsPage() {
  const [materials, setMaterials] = useState<Material[]>([])
  const [subjects, setSubjects] = useState<any[]>([])
  const [selectedSubject, setSelectedSubject] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [form, setForm] = useState({ title: '', description: '', subjectId: '' })
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const { showToast } = useToast()

  useEffect(() => {
    void loadData()
  }, [])

  async function loadData() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: professor } = await supabase
        .from('professors')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (!professor) return

      // Obtener materias del profesor
      const { data: subs } = await supabase
        .from('subjects')
        .select('id, name, code')
        .eq('professor_id', professor.id)
        .order('name')

      setSubjects(subs || [])

      // Obtener materiales
      const { data: mats } = await supabase
        .from('materials')
        .select(`
          id,
          title,
          description,
          file_name,
          file_url,
          file_type,
          file_size,
          created_at,
          subject:subjects(id, name, code)
        `)
        .eq('professor_id', professor.id)
        .order('created_at', { ascending: false })

      setMaterials(mats || [])
    } catch (err) {
      console.error('Error:', err)
      showToast('Error cargando datos', 'error')
    } finally {
      setLoading(false)
    }
  }

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault()

    if (!selectedFile || !form.title || !form.subjectId) {
      showToast('Completa todos los campos', 'error')
      return
    }

    if (selectedFile.size > 50 * 1024 * 1024) {
      showToast('Archivo muy grande (máx 50MB)', 'error')
      return
    }

    setUploading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: professor } = await supabase
        .from('professors')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (!professor) return

      // Subir archivo a Storage
      const fileName = `${Date.now()}-${selectedFile.name}`
      const filePath = `materials/${form.subjectId}/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('materials')
        .upload(filePath, selectedFile)

      if (uploadError) throw uploadError

      // Obtener URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('materials')
        .getPublicUrl(filePath)

      // Crear registro en DB
      const { error: dbError } = await supabase
        .from('materials')
        .insert({
          subject_id: form.subjectId,
          professor_id: professor.id,
          title: form.title,
          description: form.description || null,
          file_name: selectedFile.name,
          file_url: publicUrl,
          file_type: selectedFile.type.split('/')[1] || 'file',
          file_size: selectedFile.size,
        })

      if (dbError) throw dbError

      showToast('Archivo compartido correctamente')
      setForm({ title: '', description: '', subjectId: '' })
      setSelectedFile(null)
      await loadData()
    } catch (err) {
      console.error('Error:', err)
      showToast('Error al subir archivo', 'error')
    } finally {
      setUploading(false)
    }
  }

  async function deleteMaterial(id: string) {
    if (!confirm('¿Eliminar este material?')) return

    try {
      const { error } = await supabase
        .from('materials')
        .delete()
        .eq('id', id)

      if (error) throw error

      showToast('Material eliminado')
      await loadData()
    } catch (err) {
      console.error('Error:', err)
      showToast('Error al eliminar', 'error')
    }
  }

  const filteredMaterials = selectedSubject
    ? materials.filter(m => (m.subject as any).id === selectedSubject)
    : materials

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '-'
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('es-AR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  if (loading) {
    return <p className="text-slate-600">Cargando...</p>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Materiales de Clase</h1>
        <p className="text-slate-600 text-sm mt-1">Comparte documentos con tus estudiantes</p>
      </div>

      {/* Formulario de carga */}
      <div className="card p-6 space-y-4">
        <h2 className="font-semibold text-lg">Compartir nuevo material</h2>
        <form onSubmit={handleUpload} className="space-y-4">
          <div>
            <label className="form-label">Materia *</label>
            <select
              required
              value={form.subjectId}
              onChange={(e) => setForm(f => ({ ...f, subjectId: e.target.value }))}
              className="form-input"
            >
              <option value="">Seleccionar...</option>
              {subjects.map(s => (
                <option key={s.id} value={s.id}>
                  {s.code} - {s.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="form-label">Título del material *</label>
            <input
              required
              type="text"
              value={form.title}
              onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="Ej: Apuntes Tema 1"
              className="form-input"
            />
          </div>

          <div>
            <label className="form-label">Descripción (opcional)</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Descripción del material"
              className="form-input"
              rows={3}
            />
          </div>

          <div>
            <label className="form-label">Archivo *</label>
            <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:border-slate-400 transition cursor-pointer">
              <input
                required
                type="file"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                className="hidden"
                id="file-input"
              />
              <label htmlFor="file-input" className="cursor-pointer block">
                <Upload size={32} className="mx-auto text-slate-400 mb-2" />
                <p className="text-sm font-medium text-slate-700">
                  {selectedFile ? selectedFile.name : 'Selecciona un archivo'}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Máx 50MB | PDF, Word, PowerPoint, etc.
                </p>
              </label>
            </div>
          </div>

          <button
            type="submit"
            disabled={uploading}
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            {uploading ? (
              <>
                <Loader size={18} className="animate-spin" />
                Subiendo...
              </>
            ) : (
              <>
                <Upload size={18} />
                Compartir archivo
              </>
            )}
          </button>
        </form>
      </div>

      {/* Lista de materiales */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-lg">Materiales compartidos ({filteredMaterials.length})</h2>
          {subjects.length > 1 && (
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="form-input text-sm w-64"
            >
              <option value="">Todas las materias</option>
              {subjects.map(s => (
                <option key={s.id} value={s.id}>
                  {s.code} - {s.name}
                </option>
              ))}
            </select>
          )}
        </div>

        {filteredMaterials.length === 0 ? (
          <div className="card p-6 text-center">
            <p className="text-slate-500">
              {materials.length === 0
                ? 'Aún no has compartido materiales.'
                : 'No hay materiales para esta materia.'}
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredMaterials.map((material) => (
              <div key={material.id} className="card p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{material.title}</h3>
                    <p className="text-sm text-slate-600 mt-0.5">
                      {material.subject.code} • {material.subject.name}
                    </p>
                    {material.description && (
                      <p className="text-sm text-slate-600 mt-2">{material.description}</p>
                    )}
                    <div className="flex items-center gap-4 mt-3 text-xs text-slate-600">
                      <span>{formatDate(material.created_at)}</span>
                      <span>{formatFileSize(material.file_size)}</span>
                      {material.file_type && (
                        <span className="px-2 py-1 bg-slate-100 rounded">
                          {material.file_type.toUpperCase()}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <a
                      href={material.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      download
                      className="p-2 bg-blue-100 hover:bg-blue-200 rounded-lg text-blue-600 transition"
                      title="Descargar"
                    >
                      <Download size={18} />
                    </a>
                    <button
                      onClick={() => deleteMaterial(material.id)}
                      className="p-2 bg-red-100 hover:bg-red-200 rounded-lg text-red-600 transition"
                      title="Eliminar"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
