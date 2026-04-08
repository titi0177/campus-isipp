import { createFileRoute, Link } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { generateRegularCertificate } from '@/utils/generateRegularCertificate'
import { FileText, GraduationCap, CalendarCheck, BookOpen } from 'lucide-react'
import StatCard from '@/components/StatCard'

export const Route = createFileRoute('/dashboard/')({
  component: DashboardPage,
})

function DashboardPage() {

  const [student, setStudent] = useState<any>(null)
  const [subjects, setSubjects] = useState<any[]>([])
  const [attendancePercent, setAttendancePercent] = useState<number>(0)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return

    const { data: studentData } = await supabase
      .from('students')
      .select(`
        *,
        program:programs(name)
      `)
      .eq('user_id', user.id)
      .single()

    setStudent(studentData)

    const { data: grades } = await supabase
      .from('grades')
      .select(`
        final_grade,
        enrollment:enrollments(
          subject:subjects(name)
        )
      `)
      .eq('enrollment.student_id', studentData.id)

    setSubjects(grades || [])

    const { data: attendance } = await supabase
      .from('attendance')
      .select('present, enrollment:enrollments(student_id)')
      .eq('enrollment.student_id', studentData.id)

    if (attendance) {

      const total = attendance.length
      const present = attendance.filter(a => a.present).length
      const percent = total ? Math.round((present / total) * 100) : 0

      setAttendancePercent(percent)

    }

  }

  if (!student) return null

  const approved = subjects.filter((s:any) => s.final_grade >= 4).length

  return (

    <div className="space-y-8">

      {/* HEADER */}

      <div className="flex justify-between items-center">

        <div>

          <h1 className="text-3xl font-bold text-gray-900">
            Panel del Alumno
          </h1>

          <p className="text-gray-500 text-sm">
            {student.first_name} {student.last_name} • {student.program?.name}
          </p>

        </div>

      </div>


      {/* ESTADISTICAS */}

      <div className="grid md:grid-cols-4 gap-6">

        <StatCard
          icon={GraduationCap}
          title="Materias aprobadas"
          value={approved}
          color="bg-blue-100 text-blue-600"
        />

        <StatCard
          icon={CalendarCheck}
          title="Asistencia"
          value={`${attendancePercent}%`}
          color="bg-green-100 text-green-600"
        />

        <StatCard
          icon={BookOpen}
          title="Materias cursadas"
          value={subjects.length}
          color="bg-purple-100 text-purple-600"
        />

        <div className="bg-white rounded-xl shadow-sm border p-5">

          <div className="flex items-center gap-4">

            <div className="bg-red-100 p-3 rounded-lg">
              <FileText className="text-red-600" size={22}/>
            </div>

            <div className="space-y-1">

              <p className="text-gray-500 text-sm">
                Certificados
              </p>

              <button
                onClick={() => generateRegularCertificate(student, student.program)}
                className="text-xs bg-[#7A1E2C] text-white px-3 py-1 rounded"
              >
                Alumno Regular
              </button>

              <Link
                to="/dashboard/certificates"
                className="block text-xs text-blue-600 hover:underline"
              >
                Ver todos
              </Link>

            </div>

          </div>

        </div>

      </div>


      {/* TABLA MATERIAS */}

      <div className="bg-white rounded-xl shadow-sm border p-6">

        <h2 className="text-lg font-semibold mb-4">
          Mis materias
        </h2>

        <table className="w-full text-sm">

          <thead>

            <tr className="border-b text-gray-600">

              <th className="text-left py-3">
                Materia
              </th>

              <th className="text-left py-3">
                Nota
              </th>

              <th className="text-left py-3">
                Estado
              </th>

            </tr>

          </thead>

          <tbody>

            {subjects.map((s:any, i:number) => {

              let status = "Desaprobado"
              let color = "bg-red-100 text-red-700"

              if (s.final_grade >= 7) {
                status = "Promocionado"
                color = "bg-green-100 text-green-700"
              }
              else if (s.final_grade >= 4) {
                status = "Aprobado"
                color = "bg-blue-100 text-blue-700"
              }

              return (

                <tr key={i} className="border-b hover:bg-gray-50">

                  <td className="py-3">
                    {s.enrollment?.subject?.name}
                  </td>

                  <td>
                    {s.final_grade}
                  </td>

                  <td>

                    <span className={`px-2 py-1 text-xs rounded ${color}`}>
                      {status}
                    </span>

                  </td>

                </tr>

              )

            })}

          </tbody>

        </table>

      </div>

    </div>

  )

}