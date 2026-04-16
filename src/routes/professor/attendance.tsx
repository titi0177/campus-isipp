import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Save, Download } from 'lucide-react'
import jsPDF from 'jspdf'
import 'jspdf-autotable'

export const Route = createFileRoute('/professor/attendance')({
  component: ProfessorAttendancePage,
})

type AttendanceDay = 'present' | 'absent' | null

type StudentAttendance = {
  enrollmentId: string
  division?: string | null
  legajo: string
  name: string
  dni: string
  monthlyAttendance: { [month: number]: { [day: number]: AttendanceDay } }
  totalPresent: number
  totalDays: number
  accumulativePercentage: number
  isDirty?: boolean
}

function ProfessorAttendancePage() {
  const [subjects, setSubjects] = useState<any[]>([])
  const [selectedSubject, setSelectedSubject] = useState('')
  const [selectedDivision, setSelectedDivision] = useState<string | null>(null)
  const [subjectName, setSubjectName] = useState('')
  const [students, setStudents] = useState<StudentAttendance[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1)
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear())
  const [originalStudents, setOriginalStudents] = useState<StudentAttendance[]>([])

  const availableMonths = [4, 5, 6, 7, 8, 9, 10, 11, 12]
  const monthNames: { [key: number]: string } = {
    4: 'Abril', 5: 'Mayo', 6: 'Junio', 7: 'Julio', 8: 'Agosto',
    9: 'Septiembre', 10: 'Octubre', 11: 'Noviembre', 12: 'Diciembre'
  }
  const days = Array.from({ length: 20 }, (_, i) => i + 1)

  useEffect(() => {
    loadSubjects()
  }, [])

  async function loadSubjects() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: professor } = await supabase
        .from('professors')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle()

      if (!professor) {
        alert('No eres profesor en el sistema')
        setLoading(false)
        return
      }

      const { data } = await supabase
        .from('subjects')
        .select('id, name, code, year, division')
        .eq('professor_id', professor.id)
        .order('year')
        .order('code')

      setSubjects(data ?? [])
      setLoading(false)
    } catch (err) {
      console.error('Error loading subjects:', err)
      setLoading(false)
    }
  }

  async function loadEnrollments(subjectId: string, division: string | null) {
    try {
      const subject = subjects.find(s => s.id === subjectId)
      setSubjectName(subject?.name ?? '')

      const baseQuery = supabase
        .from('enrollments')
        .select(`
          id,
          division,
          student_id,
          student:students(id, first_name, last_name, legajo, dni)
        `)
        .eq('subject_id', subjectId)
        .order('student(last_name)', { ascending: true })

      const { data: allEnrollmentsData, error: enrollError } = await baseQuery

      if (enrollError) {
        console.error('Error loading enrollments:', enrollError)
        return
      }

      // Filtrar por división en memoria si es necesario
      const enrollmentsData = division && allEnrollmentsData
        ? allEnrollmentsData.filter(e => e.division === division)
        : allEnrollmentsData

      if (enrollmentsData && enrollmentsData.length > 0) {
        const enrollmentIds = enrollmentsData.map(e => e.id)
        const { data: allAttendanceData } = await supabase
          .from('class_attendance')
          .select('enrollment_id, date, present')
          .in('enrollment_id', enrollmentIds)
          .gte('date', `${currentYear}-04-01`)
          .lt('date', `${currentYear}-12-31`)

        const studentList: StudentAttendance[] = enrollmentsData.map((enr: any) => {
          const studentAttendance = (allAttendanceData || []).filter(
            (a: any) => a.enrollment_id === enr.id
          )

          const monthlyAttendance: { [month: number]: { [day: number]: AttendanceDay } } = {}
          let totalPresent = 0
          let totalDays = 0

          for (const month of availableMonths) {
            monthlyAttendance[month] = {}
            for (let day = 1; day <= 20; day++) {
              const dayStr = String(day).padStart(2, '0')
              const dateStr = `${currentYear}-${String(month).padStart(2, '0')}-${dayStr}`
              const record = studentAttendance.find((a: any) => a.date === dateStr)
              
              let dayStatus: AttendanceDay = null
              if (record) {
                dayStatus = record.present ? 'present' : 'absent'
                totalDays++
                if (record.present) totalPresent++
              }
              
              monthlyAttendance[month][day] = dayStatus
            }
          }

          const accumulativePercentage = totalDays > 0 
            ? Math.round((totalPresent / totalDays) * 100)
            : 0

          return {
            enrollmentId: enr.id,
            division: enr.division,
            legajo: enr.student?.legajo ?? 'S/N',
            name: `${enr.student?.last_name || 'Sin'} ${enr.student?.first_name || 'Nombre'}`,
            dni: enr.student?.dni ?? 'S/N',
            monthlyAttendance,
            totalPresent,
            totalDays,
            accumulativePercentage,
            isDirty: false,
          }
        })

        setStudents(studentList)
        setOriginalStudents(JSON.parse(JSON.stringify(studentList)))
      } else {
        setStudents([])
        setOriginalStudents([])
      }
    } catch (err) {
      console.error('Error loading enrollments:', err)
      alert('Error cargando alumnos: ' + String(err))
    }
  }

  function toggleAttendance(enrollmentId: string, month: number, day: number) {
    setStudents(prev =>
      prev.map(s => {
        if (s.enrollmentId === enrollmentId) {
          const updated = { ...s }
          updated.monthlyAttendance = JSON.parse(JSON.stringify(s.monthlyAttendance))
          
          const current = updated.monthlyAttendance[month][day]
          let next: AttendanceDay
          if (current === null) {
            next = 'present'
          } else if (current === 'present') {
            next = 'absent'
          } else {
            next = null
          }
          
          updated.monthlyAttendance[month][day] = next
          updated.isDirty = true

          let totalPresent = 0
          let totalDays = 0

          for (const m of availableMonths) {
            for (let d = 1; d <= 20; d++) {
              const dayStatus = updated.monthlyAttendance[m] && updated.monthlyAttendance[m][d]
              if (dayStatus !== null && dayStatus !== undefined) {
                totalDays++
                if (dayStatus === 'present') totalPresent++
              }
            }
          }

          updated.totalPresent = totalPresent
          updated.totalDays = totalDays
          updated.accumulativePercentage = totalDays > 0 
            ? Math.round((totalPresent / totalDays) * 100)
            : 0

          return updated
        }
        return s
      })
    )
  }

  async function saveAttendance() {
    setSaving(true)
    try {
      const startTime = performance.now()

      const allOperations: Promise<any>[] = []

      for (const student of students) {
        allOperations.push(
          supabase
            .from('attendance')
            .upsert(
              {
                enrollment_id: student.enrollmentId,
                percentage: student.accumulativePercentage,
              },
              { onConflict: 'enrollment_id' }
            )
        )

        const attendanceRecords: any[] = []
        const recordsToDelete: string[] = []

        for (const month of availableMonths) {
          for (let day = 1; day <= 20; day++) {
            const dayStr = String(day).padStart(2, '0')
            const dateStr = `${currentYear}-${String(month).padStart(2, '0')}-${dayStr}`
            const dayStatus = student.monthlyAttendance[month][day]

            if (dayStatus === null) {
              recordsToDelete.push(dateStr)
            } else {
              attendanceRecords.push({
                enrollment_id: student.enrollmentId,
                date: dateStr,
                present: dayStatus === 'present',
              })
            }
          }
        }

        if (attendanceRecords.length > 0) {
          allOperations.push(
            supabase
              .from('class_attendance')
              .upsert(attendanceRecords, { onConflict: 'enrollment_id,date' })
          )
        }

        if (recordsToDelete.length > 0) {
          allOperations.push(
            supabase
              .from('class_attendance')
              .delete()
              .eq('enrollment_id', student.enrollmentId)
              .in('date', recordsToDelete)
          )
        }
      }

      await Promise.all(allOperations)

      const endTime = performance.now()
      const timeSeconds = ((endTime - startTime) / 1000).toFixed(2)

      alert(`Asistencia guardada correctamente (${students.length} estudiantes) en ${timeSeconds}s`)
      
      if (selectedSubject) loadEnrollments(selectedSubject, selectedDivision)
    } catch (err) {
      console.error('Error saving:', err)
      alert('Error guardando asistencia: ' + String(err))
    } finally {
      setSaving(false)
    }
  }

  function generatePDF() {
    if (!selectedSubject) {
      alert('Selecciona una materia')
      return
    }

    const doc = new jsPDF('l')
    const currentDate = new Date().toLocaleDateString('es-AR')

    doc.setFontSize(16)
    doc.text('PLANILLA DE ASISTENCIA ACUMULADA', 148, 15, { align: 'center' })
    
    doc.setFontSize(11)
    doc.text(`Materia: ${subjectName}`, 14, 25)
    if (selectedDivision) {
      doc.text(`División: ${selectedDivision}`, 14, 31)
      doc.text(`Período: Abril - Diciembre ${currentYear}`, 14, 37)
      doc.text(`Generado: ${currentDate}`, 14, 43)
    } else {
      doc.text(`Período: Abril - Diciembre ${currentYear}`, 14, 31)
      doc.text(`Generado: ${currentDate}`, 14, 37)
    }

    const tableData = students.map(s => [
      s.legajo,
      s.name,
      s.division || '-',
      s.totalPresent,
      s.totalDays,
      `${s.accumulativePercentage}%`,
    ])

    const headers = selectedDivision 
      ? ['Legajo', 'Alumno', 'Presentes', 'Total Días', '% Acumulado']
      : ['Legajo', 'Alumno', 'Div.', 'Presentes', 'Total Días', '% Acumulado']

    doc.autoTable({
      head: [headers],
      body: tableData,
      startY: selectedDivision ? 45 : 50,
      margin: 10,
      headStyles: { fillColor: [88, 44, 49], fontSize: 10 },
      bodyStyles: { fontSize: 9 },
      alternateRowStyles: { fillColor: [240, 240, 240] },
    })

    doc.save(`planilla_asistencia_${subjectName}${selectedDivision ? `_div${selectedDivision}` : ''}_acumulada.pdf`)
  }

  function getCheckboxStyle(status: AttendanceDay) {
    if (status === 'present') return 'bg-green-100 border-green-500'
    if (status === 'absent') return 'bg-red-100 border-red-500'
    return 'bg-gray-100 border-gray-300'
  }

  function getCheckboxLabel(status: AttendanceDay) {
    if (status === 'present') return '✓'
    if (status === 'absent') return '✗'
    return '-'
  }

  if (loading) {
    return <p className="text-slate-600">Cargando...</p>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="siu-page-title text-2xl">Control de Asistencia</h1>
        <p className="siu-page-subtitle mt-1">Asistencia acumulativa de Abril a Diciembre (20 días por mes) - 3 estados: Presente, Ausente, Sin clase</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl">
        <div>
          <label htmlFor="subject-select" className="form-label">Materia</label>
          <select
            id="subject-select"
            name="subject"
            className="form-input"
            value={selectedSubject}
            onChange={(e) => {
              setSelectedSubject(e.target.value)
              setSelectedDivision(null)
              if (e.target.value) {
                loadEnrollments(e.target.value, null)
              }
            }}
          >
            <option value="">Seleccionar...</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.code} - {s.name} {s.division ? `Div. ${s.division}` : ''}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="month-select" className="form-label">Ver/Editar Mes</label>
          <select
            id="month-select"
            name="month"
            className="form-input"
            value={currentMonth}
            onChange={(e) => {
              setCurrentMonth(parseInt(e.target.value))
            }}
          >
            {availableMonths.map((m) => (
              <option key={m} value={m}>{monthNames[m]}</option>
            ))}
          </select>
        </div>

        {selectedSubject && subjects.find(s => s.id === selectedSubject)?.year === 1 && (
          <div>
            <label htmlFor="division-select" className="form-label">División (Año 1)</label>
            <select
              id="division-select"
              className="form-input"
              value={selectedDivision || ''}
              onChange={(e) => {
                const div = e.target.value || null
                setSelectedDivision(div)
                loadEnrollments(selectedSubject, div)
              }}
            >
              <option value="">Ver ambas divisiones</option>
              <option value="A">División A</option>
              <option value="B">División B</option>
            </select>
          </div>
        )}
      </div>

      {selectedSubject && students.length > 0 && (
        <div className="space-y-4">
          <div className="card p-0 overflow-x-auto">
            <div className="bg-slate-700 text-white p-4">
              <h2 className="font-bold text-lg">{monthNames[currentMonth]} {currentYear}</h2>
            </div>
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-slate-600 border-b sticky top-0 text-white">
                  <th className="px-3 py-2 text-left min-w-20">Legajo</th>
                  <th className="px-3 py-2 text-left min-w-48">Alumno</th>
                  {!selectedDivision && <th className="px-3 py-2 text-center bg-slate-700 w-12">Div.</th>}
                  <th className="px-3 py-2 text-left min-w-16">DNI</th>
                  {days.map(day => (
                    <th key={day} className="px-1 py-2 text-center w-8 font-bold text-xs">
                      {day}
                    </th>
                  ))}
                  <th className="px-3 py-2 text-center w-24 bg-slate-800 font-bold">% Mes</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student) => {
                  const monthPresent = Object.values(student.monthlyAttendance[currentMonth])
                    .filter(v => v === 'present').length
                  const monthTotal = Object.values(student.monthlyAttendance[currentMonth])
                    .filter(v => v !== null).length
                  const monthPercentage = monthTotal > 0 
                    ? Math.round((monthPresent / monthTotal) * 100)
                    : 0

                  return (
                    <tr key={student.enrollmentId} className="border-b hover:bg-blue-50 transition-colors">
                      <td className="px-3 py-2 font-medium text-slate-900">{student.legajo}</td>
                      <td className="px-3 py-2 text-slate-900 font-medium">{student.name}</td>
                      {!selectedDivision && <td className="px-3 py-2 text-center font-bold text-blue-600">{student.division}</td>}
                      <td className="px-3 py-2 text-slate-600 text-sm">{student.dni}</td>
                      {days.map(day => {
                        const status = student.monthlyAttendance[currentMonth]?.[day]
                        return (
                          <td key={`${student.enrollmentId}-${day}`} className="px-1 py-2 text-center border-r border-gray-200">
                            <button
                              onClick={() => toggleAttendance(student.enrollmentId, currentMonth, day)}
                              id={`attendance-${student.enrollmentId}-${currentMonth}-${day}`}
                              className={`w-7 h-7 rounded font-bold text-sm transition-colors cursor-pointer border-2 ${getCheckboxStyle(status)}`}
                              title={status === 'present' ? 'Presente' : status === 'absent' ? 'Ausente' : 'Sin clase'}
                            >
                              {getCheckboxLabel(status)}
                            </button>
                          </td>
                        )
                      })}
                      <td className="px-3 py-2 text-center font-bold bg-slate-100">
                        <span className={`px-2 py-1 rounded text-xs font-bold ${
                          monthPercentage >= 80 ? 'bg-green-100 text-green-800' :
                          monthPercentage >= 60 ? 'bg-yellow-100 text-yellow-800' :
                          monthPercentage > 0 ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {monthTotal > 0 ? `${monthPercentage}%` : '-'}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div className="card p-4 bg-green-50 border border-green-200">
            <h3 className="font-bold text-green-900 mb-3">Resumen Acumulativo (Abril - Diciembre)</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-green-200">
                    <th className="px-3 py-2 text-left">Alumno</th>
                    {!selectedDivision && <th className="px-3 py-2 text-center">Div.</th>}
                    <th className="px-3 py-2 text-center">Presentes</th>
                    <th className="px-3 py-2 text-center">Total Días</th>
                    <th className="px-3 py-2 text-center font-bold">% Acumulado</th>
                    <th className="px-3 py-2 text-center">Habilitado</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((student) => (
                    <tr key={student.enrollmentId} className="border-b">
                      <td className="px-3 py-2 font-medium">{student.name}</td>
                      {!selectedDivision && <td className="px-3 py-2 text-center font-bold text-blue-600">{student.division}</td>}
                      <td className="px-3 py-2 text-center">{student.totalPresent}</td>
                      <td className="px-3 py-2 text-center">{student.totalDays}</td>
                      <td className="px-3 py-2 text-center font-bold">
                        <span className={`px-2 py-1 rounded text-xs font-bold ${
                          student.accumulativePercentage >= 60 ? 'bg-green-100 text-green-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {student.accumulativePercentage}%
                        </span>
                      </td>
                      <td className="px-3 py-2 text-center">
                        {student.accumulativePercentage >= 60 ? (
                          <span className="text-green-700 font-bold">✓</span>
                        ) : (
                          <span className="text-red-700 font-bold">✗</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={saveAttendance}
              disabled={saving}
              className="btn-primary flex items-center gap-2"
            >
              <Save size={18} />
              {saving ? 'Guardando...' : 'Guardar Asistencia'}
            </button>
            <button
              onClick={generatePDF}
              className="btn-secondary flex items-center gap-2"
            >
              <Download size={18} />
              Descargar PDF Acumulado
            </button>
          </div>

          <div className="card p-4 bg-blue-50 border border-blue-200">
            <h3 className="font-bold text-blue-900 mb-2">Cómo funciona:</h3>
            <ul className="text-sm text-blue-900 space-y-2">
              <li><strong style={{color: '#16a34a'}}>✓ Verde:</strong> Alumno presente</li>
              <li><strong style={{color: '#dc2626'}}>✗ Rojo:</strong> Alumno ausente</li>
              <li><strong style={{color: '#6b7280'}}>- Gris:</strong> Sin clase / No se contabiliza</li>
              <li><strong>% Mes:</strong> Solo de días registrados (presente + ausente, sin incluir "sin clase")</li>
              <li><strong>% Acumulado:</strong> Suma de Abril a Diciembre (solo días registrados)</li>
              <li><strong>Requisito Examen:</strong> Mínimo 60% acumulado</li>
            </ul>
          </div>
        </div>
      )}

      {selectedSubject && students.length === 0 && (
        <div className="card p-4 bg-slate-50 border border-slate-200">
          <p className="text-slate-600">No hay alumnos inscriptos en esta materia.</p>
        </div>
      )}

      {!selectedSubject && (
        <div className="card p-4 bg-blue-50 border border-blue-200">
          <p className="text-blue-700">Selecciona una materia para comenzar a registrar asistencia.</p>
        </div>
      )}
    </div>
  )
}
