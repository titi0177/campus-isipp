import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { DataTable } from '@/components/DataTable'
import { Modal } from '@/components/Modal'
import { useToast } from '@/components/Toast'
import { Plus, Trash2 } from 'lucide-react'

export const Route = createFileRoute('/admin/enrollments')({
  component: EnrollmentsPage,
})

function EnrollmentsPage() {
  const [enrollments, setEnrollments] = useState<any[]>([])
  const [students, setStudents] = useState<any[]>([])
  const [subjects, setSubjects] = useState<any[]>([])
  const [modalOpen, setModalOpen] = useState(false)

  const [form, setForm] = useState({
    student_id: '',
    subject_id: '',
    year: new Date().getFullYear(),
    semester: 1
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
          student:students(first_name, last_name, legajo),
          subject:subjects(name, code)
        `)
        .order('created_at', { ascending: false }),

      supabase
        .from('students')
        .select('id, first_name, last_name, legajo')
        .order('last_name'),

      supabase
        .from('subjects')
        .select('id, name, code')
        .order('name'),
    ])

    setEnrollments(e || [])
    setStudents(s || [])
    setSubjects(sub || [])
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()

    const { error } = await supabase.from('enrollments').insert({
      student_id: form.student_id,
      subject_id: form.subject_id,
      academic_year: form.year,
      attempt: 1,
      status: 'active'
    })

    if (error) {
      console.error(error)
      showToast('Error al inscribir. Verifique que no exista ya.', 'error')
      return
    }

    showToast('Inscripción creada.')

    setForm({
      student_id: '',
      subject_id: '',
      year: new Date().getFullYear(),
      semester: 1
    })

    setModalOpen(false)
    load()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar esta inscripción?')) return

    await supabase.from('enrollments').delete().eq('id', id)

    showToast('Inscripción eliminada.', 'info')
    load()
  }

  return (
    <div className="space-y-6">

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Inscripciones</h1>

        <button
          onClick={() => setModalOpen(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={16} /> Nueva Inscripción
        </button>
      </div>

      <DataTable
        columns={[
          {
            key: 'student',
            label: 'Estudiante',
            render: (r: any) => `${r.student?.last_name}, ${r.student?.first_name}`
          },
          {
            key: 'legajo',
            label: 'Legajo',
            render: (r: any) => r.student?.legajo
          },
          {
            key: 'subject',
            label: 'Materia',
            render: (r: any) => r.subject?.name
          },
          {
            key: 'code',
            label: 'Código',
            render: (r: any) => r.subject?.code
          },
          {
            key: 'academic_year',
            label: 'Año'
          },
          {
            key: 'attempt',
            label: 'Intento'
          },
        ]}
        data={enrollments}
        actions={(row: any) => (
          <button
            onClick={() => handleDelete(row.id)}
            className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg"
          >
            <Trash2 size={15} />
          </button>
        )}
      />

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Nueva Inscripción"
      >

        <form onSubmit={handleSave} className="space-y-4">

          <div>
            <label className="form-label">Estudiante *</label>
            <select
              className="form-input"
              required
              value={form.student_id}
              onChange={e =>
                setForm(p => ({ ...p, student_id: e.target.value }))
              }
            >
              <option value="">Seleccionar...</option>

              {students.map(s => (
                <option key={s.id} value={s.id}>
                  {s.last_name}, {s.first_name} ({s.legajo})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="form-label">Materia *</label>
            <select
              className="form-input"
              required
              value={form.subject_id}
              onChange={e =>
                setForm(p => ({ ...p, subject_id: e.target.value }))
              }
            >
              <option value="">Seleccionar...</option>

              {subjects.map(s => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.code})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="form-label">Año lectivo</label>
            <input
              type="number"
              className="form-input"
              value={form.year}
              onChange={e =>
                setForm(p => ({ ...p, year: +e.target.value }))
              }
            />
          </div>

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