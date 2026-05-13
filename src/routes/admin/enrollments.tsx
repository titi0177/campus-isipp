import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { DataTable } from '@/components/DataTable'
import { Modal } from '@/components/Modal'
import { useToast } from '@/components/Toast'
import { Plus, Trash2, AlertCircle, Shield, AlertTriangle, History } from 'lucide-react'

export const Route = createFileRoute('/admin/enrollments')({
  component: EnrollmentsPage,
})

interface Program {
  id: string
  name: string
}

interface Subject {
  id: string
  name: string
  code: string
  year: number
  division?: 'A' | 'B' | null
  program_id: string
  dictation_type: string
  semester: number
}

interface Student {
  id: string
  first_name: string
  last_name: string
  legajo: string
  year: number
  program_id: string
}

interface PreviousAttempt {
  academic_year: number
  final_grade?: number
  final_status?: string
}

function EnrollmentsPage() {
  const [enrollments, setEnrollments] = useState<any[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [programs, setPrograms] = useState<Program[]>([])
  
  const [modalOpen, setModalOpen] = useState(false)
  const [filterStudent, setFilterStudent] = useState('')
  const [filterSubject, setFilterSubject] = useState('')

  const [selectedProgram, setSelectedProgram] = useState('')
  const [selectedYear, setSelectedYear] = useState('')
  const [correlativeWarnings, setCorrelativeWarnings] = useState<string[]>([])
  const [yearMismatchWarning, setYearMismatchWarning] = useState('')
  const [previousAttempts, setPreviousAttempts] = useState<PreviousAttempt[]>([])

  const [form, setForm] = useState({
    student_id: '',
    subject_id: '',
    division: '',
    year: new Date().getFullYear(),
    semester: 1,
    status: 'active'
  })

  const { showToast } = useToast()

  useEffect(() => {
    load()
  }, [])

  async function load() {
    const [{ data: e }, { data: s }, { data: sub }, { data: prog }] = await Promise.all([
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
        .select('id, first_name, last_name, legajo, year, program_id')
        .order('last_name'),

      supabase
        .from('subjects')
        .select('id, name, code, year, division, program_id, dictation_type, semester')
        .order('name'),

      supabase
        .from('programs')
        .select('id, name')
        .order('name')
    ])

    setEnrollments(e || [])
    setStudents(s || [])
    setSubjects(sub || [])
    setPrograms(prog || [])
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()

    if (correlativeWarnings.length > 0) {
      showToast('Por favor, resuelve los requisitos de correlativas antes de inscribir.', 'error')
      return
    }

    if (yearMismatchWarning) {
      showToast('El año de la materia no coincide con el año del alumno.', 'error')
      return
    }

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
      semester: form.semester,
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
      semester: 1,
      status: 'active'
    })
    setCorrelativeWarnings([])
    setYearMismatchWarning('')
    setPreviousAttempts([])
    setSelectedProgram('')
    setSelectedYear('')
    setModalOpen(false)
    await load()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar esta inscripción?')) return

    await supabase.from('enrollments').delete().eq('id', id)

    showToast('Inscripción eliminada.', 'info')
    await load()
  }

  const handleStudentChange = (studentId: string) => {
    setForm(p => ({ ...p, student_id: studentId }))
    setPreviousAttempts([])
    setCorrelativeWarnings([])
    setYearMismatchWarning('')
  }

  const handleSubjectChange = async (subjectId: string) => {
    setForm(p => ({ ...p, subject_id: subjectId, division: '', semester: 1 }))
    
    const subject = subjects.find(s => s.id === subjectId)
    const student = students.find(s => s.id === form.student_id)

    if (subject && student) {
      // Validar año
      if (subject.year !== student.year) {
        setYearMismatchWarning(`⚠️ Materia es Año ${subject.year} pero alumno es Año ${student.year}`)
      } else {
        setYearMismatchWarning('')
      }

      // Cargar intentos previos
      const { data: attempts } = await supabase
        .from('enrollments')
        .select(`
          academic_year,
          enrollment_grades(final_grade, final_status)
        `)
        .eq('student_id', student.id)
        .eq('subject_id', subjectId)
        .neq('academic_year', new Date().getFullYear())

      if (attempts && attempts.length > 0) {
        setPreviousAttempts(attempts.map((a: any) => ({
          academic_year: a.academic_year,
          final_grade: a.enrollment_grades?.[0]?.final_grade,
          final_status: a.enrollment_grades?.[0]?.final_status
        })))
      }

      // Validar correlativas
      const { data: correlatives } = await supabase
        .from('subject_correlatives')
        .select('requires_subject_id, required_status')
        .eq('subject_id', subjectId)

      if (correlatives && correlatives.length > 0) {
        const { data: studentEnrollments } = await supabase
          .from('enrollments')
          .select(`
            subject_id,
            enrollment_grades(final_status)
          `)
          .eq('student_id', student.id)

        const warnings: string[] = []
        const approvedIds = new Set(
          (studentEnrollments || [])
            .filter((e: any) => {
              const g = Array.isArray(e.enrollment_grades) ? e.enrollment_grades[0] : e.enrollment_grades
              return g && ['aprobado', 'promocionado'].includes(g.final_status)
            })
            .map((e: any) => e.subject_id)
        )

        const passedIds = new Set(
          (studentEnrollments || [])
            .filter((e: any) => {
              const g = Array.isArray(e.enrollment_grades) ? e.enrollment_grades[0] : e.enrollment_grades
              return g && ['aprobado', 'promocionado', 'regular'].includes(g.final_status)
            })
            .map((e: any) => e.subject_id)
        )

        for (const corr of correlatives) {
          if (corr.required_status === 'aprobado' && !approvedIds.has(corr.requires_subject_id)) {
            const corrSubject = subjects.find(s => s.id === corr.requires_subject_id)
            warnings.push(`🔴 Requiere APROBADA: ${corrSubject?.name || 'Desconocida'}`)
          } else if (corr.required_status === 'regular' && !passedIds.has(corr.requires_subject_id)) {
            const corrSubject = subjects.find(s => s.id === corr.requires_subject_id)
            warnings.push(`🔴 Requiere REGULARIZADA: ${corrSubject?.name || 'Desconocida'}`)
          }
        }

        setCorrelativeWarnings(warnings)
      } else {
        setCorrelativeWarnings([])
      }

      // Set semester from subject
      if (subject.dictation_type === 'cuatrimestral') {
        setForm(p => ({ ...p, semester: subject.semester }))
      }
    }
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

  // Get years available for selected program
  const availableYears = selectedProgram
    ? Array.from(new Set(
        subjects
          .filter(s => s.program_id === selectedProgram)
          .map(s => s.year)
      )).sort()
    : []

  // Get subjects for selected program and year
  const filteredSubjects = selectedProgram && selectedYear
    ? subjects.filter(s => s.program_id === selectedProgram && s.year === parseInt(selectedYear))
    : []

  // Get students for selected program
  const filteredStudents = selectedProgram
    ? students.filter(s => s.program_id === selectedProgram)
    : []

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
          {/* Step 1: Carrera */}
          <div>
            <label className="form-label">Carrera *</label>
            <select
              className="form-input"
              required
              value={selectedProgram}
              onChange={e => {
                setSelectedProgram(e.target.value)
                setSelectedYear('')
                setForm(p => ({ ...p, subject_id: '', student_id: '' }))
              }}
            >
              <option value="">Seleccionar carrera...</option>
              {programs.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          {/* Step 2: Año */}
          {selectedProgram && (
            <div>
              <label className="form-label">Año *</label>
              <select
                className="form-input"
                required
                value={selectedYear}
                onChange={e => {
                  setSelectedYear(e.target.value)
                  setForm(p => ({ ...p, subject_id: '' }))
                }}
              >
                <option value="">Seleccionar año...</option>
                {availableYears.map(y => (
                  <option key={y} value={y}>Año {y}</option>
                ))}
              </select>
            </div>
          )}

          {/* Step 3: Materia */}
          {selectedYear && (
            <div>
              <label className="form-label">Materia *</label>
              <select
                className="form-input"
                required
                value={form.subject_id}
                onChange={e => handleSubjectChange(e.target.value)}
              >
                <option value="">Seleccionar materia...</option>
                {filteredSubjects.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.code}) {s.division ? `Div. ${s.division}` : ''}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Step 4: Estudiante */}
          {selectedProgram && (
            <div>
              <label className="form-label">Estudiante *</label>
              <select
                className="form-input"
                required
                value={form.student_id}
                onChange={e => handleStudentChange(e.target.value)}
              >
                <option value="">Seleccionar estudiante...</option>
                {filteredStudents.map(s => (
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
          )}

          {/* Warnings */}
          {yearMismatchWarning && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex gap-2">
              <AlertTriangle size={16} className="text-red-600 flex-shrink-0 mt-0.5" />
              <span className="text-sm text-red-700">{yearMismatchWarning}</span>
            </div>
          )}

          {correlativeWarnings.length > 0 && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg space-y-1">
              <div className="flex gap-2">
                <AlertTriangle size={16} className="text-red-600 flex-shrink-0 mt-0.5" />
                <span className="text-sm font-semibold text-red-700">Requisitos no cumplidos:</span>
              </div>
              {correlativeWarnings.map((w, i) => (
                <div key={i} className="text-xs text-red-700 ml-6">{w}</div>
              ))}
            </div>
          )}

          {previousAttempts.length > 0 && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg space-y-2">
              <div className="flex gap-2">
                <History size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
                <span className="text-sm font-semibold text-amber-700">Intentos previos:</span>
              </div>
              {previousAttempts.map((a, i) => (
                <div key={i} className="text-xs text-amber-700 ml-6">
                  {a.academic_year}: {a.final_status?.toUpperCase() || 'EN_CURSO'} {a.final_grade ? `(${a.final_grade})` : ''}
                </div>
              ))}
            </div>
          )}

          {/* División */}
          {selectedSubject && (
            <div>
              <label className="form-label">División (Año 1)</label>
              <select
                className="form-input"
                value={form.division}
                onChange={e => setForm(p => ({ ...p, division: e.target.value }))}
                disabled={selectedSubject.year !== 1}
              >
                <option value="">Sin división</option>
                {selectedSubject.year === 1 && (
                  <>
                    <option value="A">División A</option>
                    <option value="B">División B</option>
                  </>
                )}
              </select>
              {selectedSubject.year !== 1 && (
                <p className="text-xs text-slate-500 mt-1">Solo se aplica a 1er año</p>
              )}
            </div>
          )}

          {/* Cuatrimestre */}
          {selectedSubject && selectedSubject.dictation_type === 'cuatrimestral' && (
            <div>
              <label className="form-label">Cuatrimestre</label>
              <select
                className="form-input"
                value={form.semester}
                onChange={e => setForm(p => ({ ...p, semester: parseInt(e.target.value) }))}
              >
                <option value="1">1er Cuatrimestre</option>
                <option value="2">2do Cuatrimestre</option>
              </select>
            </div>
          )}

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
            <button 
              type="submit" 
              className="btn-primary flex-1"
              disabled={correlativeWarnings.length > 0 || !!yearMismatchWarning}
            >
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