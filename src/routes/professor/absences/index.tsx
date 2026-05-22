import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { sendAbsenceEmail } from '@/lib/email-service'
import { Download, Send, AlertCircle, CheckCircle2, Calendar, Clock, BookOpen, FileText } from 'lucide-react'

export const Route = createFileRoute('/professor/absences/')({
  component: AbsencesPage,
})

const ARTICULOS = [
  { code: 'ART_23_A', label: 'Art. 23 inc. a - Razones particulares justificadas', type: 'general' },
  { code: 'ART_33', label: 'Art. 33 - Exámenes', type: 'general' },
  { code: 'ART_36', label: 'Art. 36 - Capacitación o perfeccionamiento', type: 'general' },
  { code: 'ART_43_49', label: 'Art. 43-49 - Enfermedad común / largo tratamiento', type: 'medical' },
  { code: 'ART_50_51_M', label: 'Art. 50-51 - Maternidad', type: 'medical' },
  { code: 'ART_50_51_P', label: 'Art. 50-51 - Paternidad', type: 'medical' },
  { code: 'ART_52', label: 'Art. 52 - Atención familiar enfermo', type: 'medical' },
  { code: 'ART_53', label: 'Art. 53 - Fallecimiento familiar (duelo)', type: 'general' },
  { code: 'ART_54', label: 'Art. 54 - Matrimonio', type: 'general' },
  { code: 'ART_55', label: 'Art. 55 - Mudanza', type: 'general' },
]

function AbsencesPage() {
  const [professor, setProfessor] = useState<any>(null)
  const [subjects, setSubjects] = useState<any[]>([])
  const [absences, setAbsences] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Form state
  const [formData, setFormData] = useState({
    absence_date: '',
    time_start: '',
    time_end: '',
    subject_id: '',
    article: '',
    description: '',
  })
  const [documentFile, setDocumentFile] = useState<File | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setError('No autenticado')
        setLoading(false)
        return
      }

      // Obtener profesor
      const { data: profData } = await supabase
        .from('professors')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (!profData) {
        setError('Profesor no encontrado')
        setLoading(false)
        return
      }

      setProfessor(profData)

      // Obtener materias del profesor
      const { data: subData } = await supabase
        .from('subjects')
        .select('*')
        .eq('professor_id', profData.id)

      setSubjects(subData || [])

      // Obtener historial de inasistencias
      const { data: absData } = await supabase
        .from('professor_absences')
        .select('*')
        .eq('professor_id', profData.id)
        .order('created_at', { ascending: false })

      setAbsences(absData || [])

      setLoading(false)
    } catch (err) {
      console.error('Error loading data:', err)
      setError('Error al cargar datos')
      setLoading(false)
    }
  }

  const handleDownloadTemplate = () => {
    const articulo = ARTICULOS.find(a => a.code === formData.article)
    const isMedical = articulo?.type === 'medical'
    const fileName = isMedical ? 'licencias-medicas.docx' : 'justificacion-inasistencia.docx'

    // Generar URL pública de Supabase Storage
    const bucketUrl = `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/professor-absences/${fileName}`

    window.open(bucketUrl, '_blank')
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (!file.name.endsWith('.docx')) {
        setError('Solo se aceptan archivos .docx')
        return
      }
      if (file.size > 5 * 1024 * 1024) {
        setError('El archivo no puede superar 5MB')
        return
      }
      setDocumentFile(file)
      setError('')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    setSuccess('')

    try {
      // Validar campos
      if (!formData.absence_date || !formData.time_start || !formData.time_end || !formData.subject_id || !formData.article) {
        throw new Error('Completa todos los campos requeridos')
      }

      if (!documentFile) {
        throw new Error('Debes cargar el documento completado')
      }

      if (!professor) {
        throw new Error('Profesor no encontrado')
      }

      // Subir archivo a Supabase Storage
      const timestamp = new Date().getTime()
      const fileName = `${professor.id}/${timestamp}_${documentFile.name}`

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('professor-absences-submitted')
        .upload(fileName, documentFile)

      if (uploadError) throw uploadError

      // Obtener URL pública
      const { data: urlData } = supabase.storage
        .from('professor-absences-submitted')
        .getPublicUrl(fileName)

      const documentUrl = urlData?.publicUrl || ''

      // Obtener nombre de materia
      const subject = subjects.find(s => s.id === formData.subject_id)
      const articuloLabel = ARTICULOS.find(a => a.code === formData.article)?.label || formData.article

      // Enviar email
      await sendAbsenceEmail(
        professor.name,
        subject?.name || 'Desconocida',
        articuloLabel,
        formData.absence_date,
        formData.time_start,
        formData.time_end,
        formData.description,
        documentUrl,
        documentFile.name
      )

      // Guardar registro en BD
      const { error: insertError } = await supabase
        .from('professor_absences')
        .insert([
          {
            professor_id: professor.id,
            subject_id: formData.subject_id,
            absence_date: formData.absence_date,
            time_start: formData.time_start,
            time_end: formData.time_end,
            article: articuloLabel,
            description: formData.description,
            document_name: documentFile.name,
            document_url: documentUrl,
            status: 'enviado',
          },
        ])

      if (insertError) throw insertError

      // Limpiar form
      setFormData({
        absence_date: '',
        time_start: '',
        time_end: '',
        subject_id: '',
        article: '',
        description: '',
      })
      setDocumentFile(null)
      setSuccess('✅ Justificación enviada correctamente. El RR.HH. recibirá tu solicitud.')

      // Recargar historial
      await loadData()

      setTimeout(() => setSuccess(''), 5000)
    } catch (err) {
      console.error('Error:', err)
      setError(String(err).replace('Error: ', ''))
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-200 border-t-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-3xl p-8 text-white shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-indigo-100 text-sm font-semibold mb-2">GESTIÓN DE INASISTENCIAS</p>
            <h1 className="text-5xl font-black mb-3">Justificación de Inasistencia</h1>
            <p className="text-indigo-100 text-lg max-w-2xl">Sistema de notificación automática al departamento de Recursos Humanos</p>
          </div>
          <FileText size={80} className="opacity-20" />
        </div>
      </div>

      {/* Artículos Aplicables */}
      <div className="card p-8 bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-3xl">
        <h2 className="text-2xl font-black text-gray-900 mb-6 flex items-center gap-2">
          <BookOpen size={28} className="text-blue-600" />
          Artículos Aplicables a Docentes
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {ARTICULOS.map((art) => (
            <div key={art.code} className="p-4 rounded-xl bg-white border-2 border-blue-100 hover:border-blue-300 transition-colors">
              <p className="font-bold text-indigo-700 mb-1">{art.label.split(' - ')[0]}</p>
              <p className="text-sm text-gray-700">{art.label.split(' - ')[1]}</p>
              {art.type === 'medical' && (
                <span className="inline-block mt-2 px-2 py-1 bg-red-100 text-red-700 text-xs font-bold rounded">
                  Licencia Médica
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Formulario */}
      <div className="card p-8 bg-white border-2 border-gray-200 rounded-3xl">
        <h2 className="text-2xl font-black text-gray-900 mb-6">📝 Cargar Justificación</h2>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border-2 border-red-200 rounded-lg flex items-center gap-3">
            <AlertCircle className="text-red-600" size={20} />
            <span className="text-red-700">{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 border-2 border-green-200 rounded-lg flex items-center gap-3">
            <CheckCircle2 className="text-green-600" size={20} />
            <span className="text-green-700">{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Fila 1: Fecha y Horas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">📅 Fecha de inasistencia *</label>
              <input
                type="date"
                required
                value={formData.absence_date}
                onChange={(e) => setFormData({ ...formData, absence_date: e.target.value })}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">⏰ Hora inicio *</label>
              <input
                type="time"
                required
                value={formData.time_start}
                onChange={(e) => setFormData({ ...formData, time_start: e.target.value })}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">⏰ Hora fin *</label>
              <input
                type="time"
                required
                value={formData.time_end}
                onChange={(e) => setFormData({ ...formData, time_end: e.target.value })}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Fila 2: Materia y Artículo */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">📚 Materia *</label>
              <select
                required
                value={formData.subject_id}
                onChange={(e) => setFormData({ ...formData, subject_id: e.target.value })}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500"
              >
                <option value="">-- Selecciona materia --</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">📄 Artículo (Motivo) *</label>
              <select
                required
                value={formData.article}
                onChange={(e) => setFormData({ ...formData, article: e.target.value })}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500"
              >
                <option value="">-- Selecciona artículo --</option>
                {ARTICULOS.map((a) => (
                  <option key={a.code} value={a.code}>
                    {a.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Descripción */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">📝 Descripción adicional (opcional)</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              maxLength={500}
              placeholder="Detalles adicionales sobre tu inasistencia..."
              className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500 resize-none"
              rows={3}
            />
            <p className="text-xs text-gray-500 mt-1">{formData.description.length}/500 caracteres</p>
          </div>

          {/* Documentación */}
          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-6 rounded-xl border-2 border-indigo-200">
            <h3 className="font-bold text-gray-900 mb-4">📎 Documentación</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <button
                type="button"
                onClick={handleDownloadTemplate}
                disabled={!formData.article}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Download size={18} />
                Descargar Modelo
              </button>

              <div className="relative">
                <input
                  type="file"
                  accept=".docx"
                  onChange={handleFileChange}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                <button
                  type="button"
                  className="w-full px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg flex items-center justify-center gap-2 transition-colors"
                >
                  <FileText size={18} />
                  Cargar Documento Completado
                </button>
              </div>
            </div>

            {documentFile && (
              <div className="p-3 bg-green-100 border-2 border-green-300 rounded-lg">
                <p className="text-sm text-green-800 font-bold">✅ Archivo cargado: {documentFile.name}</p>
              </div>
            )}
          </div>

          {/* Botón Enviar */}
          <button
            type="submit"
            disabled={submitting || !documentFile}
            className="w-full px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:shadow-lg text-white font-bold rounded-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <Send size={18} />
            {submitting ? 'Enviando...' : 'Enviar Justificación'}
          </button>
        </form>
      </div>

      {/* Historial */}
      {absences.length > 0 && (
        <div className="card p-8 bg-white border-2 border-gray-200 rounded-3xl">
          <h2 className="text-2xl font-black text-gray-900 mb-6">📋 Mis Justificaciones</h2>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
                  <th className="px-4 py-3 text-left font-bold">Fecha</th>
                  <th className="px-4 py-3 text-left font-bold">Materia</th>
                  <th className="px-4 py-3 text-left font-bold">Artículo</th>
                  <th className="px-4 py-3 text-left font-bold">Estado</th>
                  <th className="px-4 py-3 text-center font-bold">Documento</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {absences.map((absence, idx) => (
                  <tr key={absence.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-4 py-3 font-semibold">{absence.absence_date}</td>
                    <td className="px-4 py-3">{absence.article.split(' - ')[0]}</td>
                    <td className="px-4 py-3 text-xs">{absence.article}</td>
                    <td className="px-4 py-3">
                      <span className="inline-block px-3 py-1 bg-green-100 text-green-700 font-bold rounded">
                        ✅ {absence.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {absence.document_url && (
                        <a href={absence.document_url} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline font-bold">
                          📎 Descargar
                        </a>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
