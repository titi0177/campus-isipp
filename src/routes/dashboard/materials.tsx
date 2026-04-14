import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/components/Toast'
import { Download, File, BookOpen } from 'lucide-react'

export const Route = createFileRoute('/dashboard/materials')({
  component: StudentMaterialsPage,
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
  professor: { name: string }
}

function StudentMaterialsPage() {
  const [materials, setMaterials] = useState<Material[]>([])
  const [loading, setLoading] = useState(true)
  const [filterSubject, setFilterSubject] = useState<string>('')
  const [subjects, setSubjects] = useState<any[]>([])
  const { showToast } = useToast()

  useEffect(() => {
    void loadData()
  }, [])

  async function loadData() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: student } = await supabase
        .from('students')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (!student) return

      // Obtener materias inscritas
      const { data: enrollments } = await supabase
        .from('enrollments')
        .select('subject_id')
        .eq('student_id', student.id)

      const subjectIds = enrollments?.map(e => e.subject_id) ?? []

      if (subjectIds.length === 0) {
        setMaterials([])
        setLoading(false)
        return
      }

      // Obtener materiales de esas materias - SIN join a professors
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
          subject_id,
          professor_id,
          subject:subjects(id, name, code),
          professor:professors(name)
        `)
        .in('subject_id', subjectIds)
        .order('created_at', { ascending: false })

      setMaterials(mats || [])

      // Obtener lista de materias para filtro
      const { data: subs } = await supabase
        .from('subjects')
        .select('id, name, code')
        .in('id', subjectIds)
        .order('name')

      setSubjects(subs || [])
    } catch (err) {
      console.error('Error:', err)
      showToast('Error cargando materiales', 'error')
    } finally {
      setLoading(false)
    }
  }

  const filteredMaterials = filterSubject
    ? materials.filter(m => (m.subject as any).id === filterSubject)
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
    return <p className="text-slate-600">Cargando materiales...</p>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <BookOpen size={28} />
          Materiales de Clase
        </h1>
        <p className="text-slate-600 text-sm mt-1">Archivos compartidos por tus profesores</p>
      </div>

      {materials.length > 0 && (
        <div className="card p-4 bg-blue-50 border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-blue-900">Filtrar por materia</p>
              <select
                value={filterSubject}
                onChange={(e) => setFilterSubject(e.target.value)}
                className="form-input text-sm mt-2"
              >
                <option value="">Todas las materias</option>
                {subjects.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.code} - {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-blue-900">{filteredMaterials.length}</p>
              <p className="text-xs text-blue-600">archivos</p>
            </div>
          </div>
        </div>
      )}

      {filteredMaterials.length === 0 ? (
        <div className="card p-6 text-center">
          <p className="text-slate-500">
            {materials.length === 0
              ? 'Aún no hay materiales compartidos.'
              : 'No hay materiales para esta materia.'}
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredMaterials.map((material) => (
            <div key={material.id} className="card p-4 hover:shadow-md transition">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 p-3 bg-slate-100 rounded-lg">
                  <File size={24} className="text-slate-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 break-words">{material.title}</h3>
                      <p className="text-sm text-slate-600 mt-0.5">
                        {material.subject.code} • {material.subject.name}
                      </p>
                      {material.description && (
                        <p className="text-sm text-slate-600 mt-2">{material.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-4 mt-3 text-xs text-slate-600">
                    <span>Prof: {material.professor?.name || '-'}</span>
                    <span>{formatDate(material.created_at)}</span>
                    <span>{formatFileSize(material.file_size)}</span>
                    {material.file_type && (
                      <span className="px-2 py-1 bg-slate-100 rounded">
                        {material.file_type.toUpperCase()}
                      </span>
                    )}
                  </div>
                </div>
                <a
                  href={material.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  download
                  className="flex-shrink-0 p-2 bg-blue-100 hover:bg-blue-200 rounded-lg text-blue-600 transition"
                  title="Descargar archivo"
                >
                  <Download size={20} />
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
