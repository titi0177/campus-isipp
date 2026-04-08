import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { generateRegularCertificate } from '@/utils/generateRegularCertificate'
import { generateApprovedSubjects } from '@/utils/generateApprovedSubjects'

export const Route = createFileRoute('/admin/student-record/$id')({
  component: StudentRecord,
})

function StudentRecord() {

  const { id } = Route.useParams()

  const [student, setStudent] = useState<any>(null)
  const [subjects, setSubjects] = useState<any[]>([])

  useEffect(() => {
    load()
  }, [])

  async function load() {

    const { data: studentData } = await supabase
      .from('students')
      .select(`
        *,
        program:programs(name)
      `)
      .eq('id', id)
      .single()

    setStudent(studentData)

    const { data } = await supabase
      .from('grades')
      .select(`
        final_grade,
        enrollment:enrollments(
          subject:subjects(name)
        )
      `)
      .eq('enrollment.student_id', id)

    const formatted = data?.map((g: any) => ({
      name: g.enrollment.subject.name,
      final_grade: g.final_grade
    }))

    setSubjects(formatted || [])
  }

  if (!student) return null

  return (
    <div className="space-y-6">

      <h1 className="text-2xl font-bold">
        Historial Académico
      </h1>

      <div className="bg-white p-6 rounded-lg shadow">
        <p><b>Alumno:</b> {student.first_name} {student.last_name}</p>
        <p><b>DNI:</b> {student.dni}</p>
        <p><b>Carrera:</b> {student.program?.name}</p>
      </div>

      <div className="flex gap-4">

        <button
          onClick={() => generateRegularCertificate(student, student.program)}
          className="btn-primary"
        >
          Constancia Alumno Regular
        </button>

        <button
          onClick={() => generateApprovedSubjects(student, subjects)}
          className="btn-secondary"
        >
          Constancia Materias Aprobadas
        </button>

      </div>

      <div className="bg-white p-6 rounded-lg shadow">

        <h2 className="text-lg font-semibold mb-4">
          Materias cursadas
        </h2>

        <table className="w-full">

          <thead>
            <tr className="border-b">
              <th className="text-left py-2">Materia</th>
              <th className="text-left py-2">Nota</th>
              <th className="text-left py-2">Estado</th>
            </tr>
          </thead>

          <tbody>

            {subjects.map((s, i) => {

              let estado = "Desaprobado"

              if (s.final_grade >= 7) estado = "Promocionado"
              else if (s.final_grade >= 4) estado = "Aprobado"

              return (
                <tr key={i} className="border-b">
                  <td className="py-2">{s.name}</td>
                  <td>{s.final_grade}</td>
                  <td>{estado}</td>
                </tr>
              )
            })}

          </tbody>

        </table>

      </div>

    </div>
  )
}