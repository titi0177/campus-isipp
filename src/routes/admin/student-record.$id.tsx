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
  const [approvedSubjects, setApprovedSubjects] = useState<any[]>([])

  useEffect(() => {
    load()
  }, [id])

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
      .from('enrollment_grades')
      .select(`
        final_grade,
        final_status,
        enrollment_id,
        enrollments!inner(
          student_id,
          subject_id,
          subjects!inner(name)
        )
      `)
      .eq('enrollments.student_id', id)

    const formatted = data?.map((g: any) => ({
      name: g.enrollments.subjects.name,
      final_grade: g.final_grade,
      final_status: g.final_status
    })) || []

    setSubjects(formatted)

    // Separar solo aprobadas y promocionadas para certificado
    const approved = formatted.filter((s: any) => 
      (s.final_status === 'regular' || s.final_status === 'promocionado') &&
      s.final_grade && s.final_grade >= 6
    )
    setApprovedSubjects(approved)
  }

  if (!student) return null

  const getEstado = (s: any) => {
    if (!s.final_grade) return 'En Curso'
    if (s.final_grade >= 8) return 'Promocionado'
    if (s.final_grade >= 6) return 'Aprobado'
    return 'Desaprobado'
  }

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

        {approvedSubjects.length > 0 && (
          <button
            onClick={() => generateApprovedSubjects(student, approvedSubjects)}
            className="btn-secondary"
          >
            Constancia Materias Aprobadas ({approvedSubjects.length})
          </button>
        )}

      </div>

      <div className="bg-white p-6 rounded-lg shadow">

        <h2 className="text-lg font-semibold mb-4">
          Materias cursadas ({subjects.length})
        </h2>

        {subjects.length === 0 ? (
          <p className="text-gray-500 text-sm">Sin materias cargadas</p>
        ) : (
          <table className="w-full">

            <thead>
              <tr className="border-b">
                <th className="text-left py-2">Materia</th>
                <th className="text-left py-2">Nota</th>
                <th className="text-left py-2">Estado</th>
              </tr>
            </thead>

            <tbody>

              {subjects.map((s, i) => (
                <tr key={i} className="border-b">
                  <td className="py-2">{s.name}</td>
                  <td>{s.final_grade || '-'}</td>
                  <td>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      !s.final_grade ? 'bg-blue-100 text-blue-700' :
                      s.final_grade >= 8 ? 'bg-green-100 text-green-700' :
                      s.final_grade >= 6 ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {getEstado(s)}
                    </span>
                  </td>
                </tr>
              ))}

            </tbody>

          </table>
        )}

      </div>

    </div>
  )
}
