import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { DataTable } from '@/components/DataTable'
import { Modal } from '@/components/Modal'
import { useToast } from '@/components/Toast'
import { Plus, Trash2, AlertCircle, Shield } from 'lucide-react'

export const Route = createFileRoute('/admin/enrollments')({
  component: EnrollmentsPage,
})

function EnrollmentsPage() {
  const [enrollments, setEnrollments] = useState<any[]>([])
  const [students, setStudents] = useState<any[]>([])
  const [subjects, setSubjects] = useState<any[]>([])
  const [modalOpen, setModalOpen] = useState(false)
  const [filterStudent, setFilterStudent] = useState('')
  const [filterSubject, setFilterSubject] = useState('')

  const [form, setForm] = useState({
    student_id: '',
    subject_id: '',
    division: '',
    year: new Date().getFullYear(),
    attempt: 1,
    status: 'active'
  })

  const { showToast } = useToast()

  useEffect(() => {
    load()
  }, [])

  async function load() {
    const [{ data: e }, { data: s }, { data: sub }] = await Promise.all([
      supabase
        .from('enrollments')
        .select(`
          *,
          student:students(id, first_name, last_name, legajo),
          subject:subjects(id, name, code, year, division)
        `)
        .order('created_at', { ascending: false }),

      supabase
        .from('students')
        .select('id, first_name, last_name, legajo, year')
        .order('last_name'),

      supabase
        .from('subjects')
        .select('id, name, code, year, division')
        .order('name'),
    ])

    setEnrollments(e || [])
    setStudents(s || [])
    setSubjects(sub || [])
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()

    // Verificar que no exista ya
    const { data: existing } = await supabase
      .from('enrollments')
      .select('id')
      .eq('student_id', form.student_id)
      .eq('subject_id', form.subject_id)
      .eq('year', form.year)
      .eq('division', form.division || null)
      .single()

    if (existing) {
      showToast('Este alumno ya está inscripto en esta materia/división en este año.', 'error')
      return
    }

    const { error } = await supabase.from('enrollments').insert({
      student_id: form.student_id,
      subject_id: form.subject_id,
      year: form.year,
      semester: 1,
      division: form.division || null,
      status: form.status
    })

    if (error) {
      console.error(error)
      showToast('Error al inscribir: ' + error.message, 'error')
      return
    }

    showToast('Inscripción creada exitosamente.', 'info')

    setForm({
      student_id: '',
      subject_id: '',
      division: '',
      year: new Date().getFullYear(),
      attempt: 1,
      status: 'active'
    })

    setModalOpen(false)
    await load()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar esta inscripción?')) return

    await supabase.from('enrollments').delete().eq('id', id)

    showToast('Inscripción eliminada.', 'info')
    await load()
  }

  // Filtrados
  const filteredEnrollments = enrollments.filter(e => {
    const studentMatch = 
      !filterStudent || 
      `${e.student?.last_name} ${e.student?.first_name}`.toLowerCase().includes(filterStudent.toLowerCase())
    
    const subjectMatch = 
      !filterSubject || 
      e.subject?.name.toLowerCase().includes(filterSubject.toLowerCase()) ||
      e.subject?.code.toLowerCase().includes(filterSubject.toLowerCase())
    
    return studentMatch && subjectMatch
  })

  const selectedStudent = students.find(s => s.id === form.student_id)
  const selectedSubject = subjects.find(s => s.id === form.subject_id)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inscripciones</h1>
          <p className="text-sm text-slate-600 mt-1">Gestiona inscripciones con soporte para divisiones A y B en 1er año</p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={16} /> Nueva Inscripción
        </button>
      </div>

      {/* Alerta de permisos */}
      <div className="card p-4 border-l-4 border-l-blue-500 bg-blue-50 border border-blue-200">
        <div className="flex items-start gap-3">
          <Shield size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-blue-900">Divisiones en Primer Año</h3>
            <p className="text-sm text-blue-800 mt-1">
              Para materias de 1er año puedes asignar <strong>División A o División B</strong>. 
              Los profesores verán separadas las notas y asistencias por división.
            </p>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="form-label">Filtrar por estudiante</label>
          <input
            type="text"
            placeholder="Nombre o legajo..."
            value={filterStudent}
            onChange={e => setFilterStudent(e.target.value)}
            className="form-input"
          />
        </div>
        <div>
          <label className="form-label">Filtrar por materia</label>
          <input
            type="text"
            placeholder="Nombre o código..."
            value={filterSubject}
            onChange={e => setFilterSubject(e.target.value)}
            className="form-input"
          />
        </div>
      </div>

      {/* Tabla */}
      {filteredEnrollments.length === 0 ? (
        <div className="card p-6 text-center">
          <AlertCircle className="w-12 h-12 mx-auto text-slate-300 mb-3" />
          <p className="text-slate-600 font-medium">No hay inscripciones que coincidan</p>
        </div>
      ) : (
        <DataTable
          columns={[
            {
              key: 'student',
              label: 'Estudiante',
              render: (r: any) => (
                <div>
                  <div className="font-medium">{r.student?.last_name}, {r.student?.first_name}</div>
                  <div className="text-xs text-slate-500">Legajo: {r.student?.legajo}</div>
                </div>
              )
            },
            {
              key: 'subject',
              label: 'Materia',
              render: (r: any) => (
                <div>
                  <div className="font-medium">{r.subject?.name}</div>
                  <div className="text-xs text-slate-500">{r.subject?.code} {r.subject?.division ? `- Div. ${r.subject.division}` : ''}</div>
                </div>
              )
            },
            {
              key: 'year',
              label: 'Año',
              render: (r: any) => r.year
            },
            {
              key: 'division',
              label: 'División',
              render: (r: any) => r.division || '-'
            },
            {
              key: 'status',
              label: 'Estado',
              render: (r: any) => (
                <span className={`text-xs font-semibold px-2 py-1 rounded ${
                  r.status === 'active' ? 'bg-green-100 text-green-800' :
                  r.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {r.status === 'active' ? 'Activa' : 
                   r.status === 'completed' ? 'Completada' : 
                   r.status}
                </span>
              )
            }
          ]}
          data={filteredEnrollments}
          actions={(row: any) => (
            <button
              onClick={() => handleDelete(row.id)}
              className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Eliminar inscripción"
            >
              <Trash2 size={16} />
            </button>
          )}
        />
      )}

      {/* Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Nueva Inscripción"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="form-label">Estudiante *</label>
              <select
                className="form-input"
                required
                value={form.student_id}
                onChange={e => setForm(p => ({ ...p, student_id: e.target.value }))}
              >
                <option value="">Seleccionar estudiante...</option>
                {students.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.last_name}, {s.first_name} ({s.legajo}) - Año {s.year}
                  </option>
                ))}
              </select>
              {selectedStudent && (
                <p className="text-xs text-slate-500 mt-1">
                  Año actual: {selectedStudent.year}
                </p>
              )}
            </div>

            <div>
              <label className="form-label">Materia *</label>
              <select
                className="form-input"
                required
                value={form.subject_id}
                onChange={e => setForm(p => ({ ...p, subject_id: e.target.value, division: '' }))}
              >
                <option value="">Seleccionar materia...</option>
                {subjects.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.code}) - Año {s.year} {s.division ? `Div. ${s.division}` : ''}
                  </option>
                ))}
              </select>
              {selectedSubject && (
                <p className="text-xs text-slate-500 mt-1">
                  Materia del año {selectedSubject.year}
                </p>
              )}
            </div>

            <div>
              <label className="form-label">División (Año 1)</label>
              <select
                className="form-input"
                value={form.division}
                onChange={e => setForm(p => ({ ...p, division: e.target.value }))}
                disabled={!selectedSubject || selectedSubject.year !== 1}
              >
                <option value="">Sin división</option>
                {selectedSubject?.year === 1 && (
                  <>
                    <option value="A">División A</option>
                    <option value="B">División B</option>
                  </>
                )}
              </select>
              {selectedSubject?.year !== 1 && (
                <p className="text-xs text-slate-500 mt-1">Solo se aplica a 1er año</p>
              )}
            </div>
          </div>

          {/* Año lectivo */}
          <div>
            <label className="form-label">Año lectivo *</label>
            <input
              type="number"
              className="form-input"
              value={form.year}
              onChange={e => setForm(p => ({ ...p, year: +e.target.value }))}
            />
          </div>

          {/* Estado */}
          <div>
            <label className="form-label">Estado</label>
            <select
              className="form-input"
              value={form.status}
              onChange={e => setForm(p => ({ ...p, status: e.target.value }))}
            >
              <option value="active">Activa</option>
              <option value="completed">Completada</option>
              <option value="dropped">Abandonada</option>
            </select>
          </div>

          {/* Botones */}
          <div className="flex gap-3 pt-2">
            <button type="submit" className="btn-primary flex-1">
              Inscribir
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
