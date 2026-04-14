import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/components/Toast'
import { Save, Download } from 'lucide-react'
import jsPDF from 'jspdf'
import 'jspdf-autotable'

export const Route = createFileRoute('/admin/attendance')({
  component: AttendancePage,
})

type StudentAttendance = {
  enrollmentId: string
  legajo: string
  name: string
  dni: string
  months: Map<number, number>
  totalPercentage: number
}

function AttendancePage() {
  const [subjects, setSubjects] = useState<any[]>([])
  const [selectedSubject, setSelectedSubject] = useState('')
  const [subjectName, setSubjectName] = useState('')
  const [students, setStudents] = useState<StudentAttendance[]>([])
  const [loading, setLoading] = useState(true)
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1)
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear())
  const { showToast } = useToast()

  const months = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ]

  useEffect(() => {
    void loadSubjects()
  }, [])

  async function loadSubjects() {
    try {
      const { data } = await supabase
        .from('subjects')
        .select('id, name, code, year')
        .order('year')
        .order('code')

      setSubjects(data ?? [])
      setLoading(false)
    } catch (err) {
      console.error('Error loading subjects:', err)
      showToast('Error cargando materias', 'error')
      setLoading(false)
    }
  }

  async function loadEnrollments(subjectId: string) {
    try {
      const subject = subjects.find(s => s.id === subjectId)
      setSubjectName(subject?.name ?? '')

      const { data } = await supabase
        .from('enrollments')
        .select(`
          id,
          student:students(first_name, last_name, legajo, dni)
        `)
        .eq('subject_id', subjectId)
        .order('student.legajo')

      if (data) {
        const studentList: StudentAttendance[] = []
        
        for (const enr of data) {
          const { data: attendanceRecords } = await supabase
            .from('attendance')
            .select('*')
            .eq('enrollment_id', enr.id)

          const monthlyData = new Map<number, number>()
          let totalPercentage = 0

          if (attendanceRecords && attendanceRecords.length > 0) {
            totalPercentage = attendanceRecords[0].percentage ?? 0
            // En una versión mejorada, podrías guardar asistencia por mes
            monthlyData.set(currentMonth, totalPercentage)
          }

          studentList.push({
            enrollmentId: enr.id,
            legajo: enr.student?.legajo,
            name: `${enr.student?.last_name}, ${enr.student?.first_name}`,
            dni: enr.student?.dni,
            months: monthlyData,
            totalPercentage,
          })
        }

        setStudents(studentList)
      }
    } catch (err) {
      console.error('Error loading enrollments:', err)
      showToast('Error cargando inscripciones', 'error')
    }
  }

  function updateMonthlyAttendance(enrollmentId: string, month: number, value: number) {
    const updated = students.map(s => {
      if (s.enrollmentId === enrollmentId) {
        const newMonths = new Map(s.months)
        newMonths.set(month, Math.min(100, Math.max(0, value)))
        
        // Calcular promedio de todos los meses
        let total = 0
        let count = 0
        newMonths.forEach(v => {
          total += v
          count++
        })
        const totalPercentage = count > 0 ? Math.round(total / count) : 0

        return { ...s, months: newMonths, totalPercentage }
      }
      return s
    })
    setStudents(updated)
  }

  async function saveAttendance() {
    try {
      for (const student of students) {
        // Guardar o actualizar el porcentaje total
        const { data: existing } = await supabase
          .from('attendance')
          .select('id')
          .eq('enrollment_id', student.enrollmentId)
          .maybeSingle()

        if (existing?.id) {
          await supabase
            .from('attendance')
            .update({ percentage: student.totalPercentage })
            .eq('id', existing.id)
        } else {
          await supabase
            .from('attendance')
            .insert({
              enrollment_id: student.enrollmentId,
              percentage: student.totalPercentage,
            })
        }
      }

      showToast('Asistencia guardada correctamente')
      void loadEnrollments(selectedSubject)
    } catch (err) {
      console.error('Error saving:', err)
      showToast('Error guardando asistencia', 'error')
    }
  }

  function generatePDF() {
    if (!selectedSubject) {
      showToast('Selecciona una materia', 'error')
      return
    }

    const doc = new jsPDF()
    const currentDate = new Date().toLocaleDateString('es-AR')

    doc.setFontSize(16)
    doc.text('PLANILLA DE ASISTENCIA', 105, 15, { align: 'center' })
    
    doc.setFontSize(12)
    doc.text(`Materia: ${subjectName}`, 14, 25)
    doc.text(`Fecha: ${currentDate}`, 14, 32)

    const tableData = students.map(s => [
      s.legajo,
      s.name,
      s.dni,
      ...months.map((_, idx) => {
        const month = idx + 1
        return s.months.has(month) ? `${s.months.get(month)}%` : '-'
      }),
      `${s.totalPercentage}%`,
    ])

    const headers = ['Legajo', 'Alumno', 'DNI', ...months, 'Total']

    doc.autoTable({
      head: [headers],
      body: tableData,
      startY: 40,
      margin: 10,
      headStyles: { fillColor: [88, 44, 49] },
      alternateRowStyles: { fillColor: [240, 240, 240] },
      didDrawPage: function(data) {
        const pageCount = doc.getNumberOfPages()
        doc.setFontSize(10)
        doc.text(
          `Página ${data.pageNumber} de ${pageCount}`,
          doc.internal.pageSize.getWidth() / 2,
          doc.internal.pageSize.getHeight() - 10,
          { align: 'center' }
        )
      }
    })

    doc.save(`planilla_asistencia_${subjectName}_${currentDate}.pdf`)
    showToast('Planilla descargada')
  }

  if (loading) {
    return <p className="text-slate-600">Cargando...</p>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Planilla de Asistencia Mensual</h1>
        <p className="text-slate-600 text-sm">Registra la asistencia mensual de los alumnos por materia</p>
      </div>

      <div className="grid grid-cols-2 gap-4 max-w-2xl">
        <div>
          <label className="form-label">Seleccionar Materia</label>
          <select
            className="form-input"
            value={selectedSubject}
            onChange={(e) => {
              setSelectedSubject(e.target.value)
              if (e.target.value) {
                void loadEnrollments(e.target.value)
              }
            }}
          >
            <option value="">Seleccionar...</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.code} - {s.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="form-label">Mes Actual</label>
          <select
            className="form-input"
            value={currentMonth}
            onChange={(e) => setCurrentMonth(parseInt(e.target.value))}
          >
            {months.map((m, idx) => (
              <option key={idx} value={idx + 1}>
                {m}
              </option>
            ))}
          </select>
        </div>
      </div>

      {selectedSubject && students.length > 0 && (
        <div className="space-y-4">
          <div className="card p-0 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="table-header">
                  <th className="px-4 py-3 text-left">Legajo</th>
                  <th className="px-4 py-3 text-left">Alumno</th>
                  <th className="px-4 py-3 text-left">DNI</th>
                  {months.map((m, idx) => (
                    <th
                      key={idx}
                      className={`px-2 py-3 text-center text-xs ${
                        idx + 1 === currentMonth
                          ? 'bg-blue-100 font-bold'
                          : ''
                      }`}
                    >
                      {m.slice(0, 3)}
                    </th>
                  ))}
                  <th className="px-4 py-3 text-center font-bold bg-slate-100">
                    Total %
                  </th>
                </tr>
              </thead>
              <tbody>
                {students.map((student) => (
                  <tr key={student.enrollmentId} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3">{student.legajo}</td>
                    <td className="px-4 py-3">{student.name}</td>
                    <td className="px-4 py-3">{student.dni}</td>
                    {months.map((_, idx) => {
                      const month = idx + 1
                      const isCurrentMonth = month === currentMonth
                      return (
                        <td
                          key={month}
                          className={`px-2 py-3 text-center ${
                            isCurrentMonth ? 'bg-blue-50' : ''
                          }`}
                        >
                          <input
                            type="number"
                            min="0"
                            max="100"
                            className={`w-12 px-1 py-1 border rounded text-center text-xs ${
                              isCurrentMonth ? 'border-blue-400' : 'border-gray-300'
                            }`}
                            value={student.months.get(month) ?? ''}
                            onChange={(e) =>
                              updateMonthlyAttendance(
                                student.enrollmentId,
                                month,
                                parseInt(e.target.value) || 0
                              )
                            }
                            placeholder="0"
                          />
                        </td>
                      )
                    })}
                    <td className="px-4 py-3 text-center font-bold bg-slate-50">
                      {student.totalPercentage}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => void saveAttendance()}
              className="btn-primary flex items-center gap-2"
            >
              <Save size={18} />
              Guardar Asistencia
            </button>
            <button
              onClick={generatePDF}
              className="btn-secondary flex items-center gap-2"
            >
              <Download size={18} />
              Descargar Planilla PDF
            </button>
          </div>
        </div>
      )}

      {selectedSubject && students.length === 0 && (
        <div className="card p-4 bg-slate-50 border border-slate-200">
          <p className="text-slate-600">No hay alumnos inscriptos en esta materia.</p>
        </div>
      )}
    </div>
  )
}
