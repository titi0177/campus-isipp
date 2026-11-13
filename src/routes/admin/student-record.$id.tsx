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
        created_at,
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
      final_status: g.final_status,
      created_at: g.created_at
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
    if (s.final_status === 'promocionado') return 'Promocionado'
    if (s.final_status === 'regular' && s.final_grade >= 6) return 'Aprobado'
    return 'Desaprobado'
  }

  const getEstadoBadge = (s: any) => {
    if (!s.final_grade) return 'bg-blue-100 text-blue-700'
    if (s.final_status === 'promocionado') return 'bg-green-100 text-green-700'
    if (s.final_status === 'regular' && s.final_grade >= 6) return 'bg-yellow-100 text-yellow-700'
    return 'bg-red-100 text-red-700'
  }

  const formatNoteWithNumeral = (nota: number | null): string => {
    if (nota === null || nota === undefined) return '—'

    const numerales: Record<number, string> = {
      1: 'UNO',
      2: 'DOS',
      3: 'TRES',
      4: 'CUATRO',
      5: 'CINCO',
      6: 'SEIS',
      7: 'SIETE',
      8: 'OCHO',
      9: 'NUEVE',
      10: 'DIEZ',
    }

    if (Number.isInteger(nota)) {
      const numeral = numerales[nota] || nota.toString()
      return `${nota} (${numeral})`
    }

    const notaStr = nota.toString().replace('.', ',')
    const parteEntera = Math.floor(nota)
    const parteDecimal = Math.round((nota - parteEntera) * 100)

    const numeralEntero = numerales[parteEntera] || parteEntera.toString()
    const numeralDecimal = numerales[parteDecimal] || parteDecimal.toString()

    return `${notaStr} (${numeralEntero}/${numeralDecimal})`
  }

  const getMonthName = (month: number): string => {
    const months = [
      'ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO',
      'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE',
    ]
    return months[month]
  }

  const getCondicion = (s: any): string => {
    if (!s.final_grade) return '—'
    if (s.final_status === 'promocionado') return 'PROMOCIONADO'
    if (s.final_status === 'regular' && s.final_grade >= 6) return 'REGULAR'
    return 'DESAPROBADO'
  }

  const getMesAño = (created_at: string | null) => {
    if (!created_at) return { mes: '—', año: '—' }
    const fecha = new Date(created_at)
    return {
      mes: getMonthName(fecha.getMonth()),
      año: fecha.getFullYear().toString()
    }
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
          <div className="overflow-x-auto">
            <table className="w-full text-sm">

              <thead>
                <tr className="border-b-2 border-gray-300 bg-gray-50">
                  <th className="text-left py-3 px-4 font-semibold">ASIGNATURA</th>
                  <th className="text-center py-3 px-4 font-semibold">CALIFICACION</th>
                  <th className="text-center py-3 px-4 font-semibold">CONDICION</th>
                  <th className="text-center py-3 px-4 font-semibold">MES</th>
                  <th className="text-center py-3 px-4 font-semibold">AÑO</th>
                </tr>
              </thead>

              <tbody>

                {subjects.map((s, i) => {
                  const { mes, año } = getMesAño(s.created_at)
                  const estado = getEstado(s)
                  const badgeClass = getEstadoBadge(s)
                  const condicion = getCondicion(s)
                  const notaFormato = formatNoteWithNumeral(s.final_grade)

                  return (
                    <tr key={i} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">{s.name}</td>
                      <td className="text-center py-3 px-4">{notaFormato}</td>
                      <td className="text-center py-3 px-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${badgeClass}`}>
                          {condicion}
                        </span>
                      </td>
                      <td className="text-center py-3 px-4">{mes}</td>
                      <td className="text-center py-3 px-4">{año}</td>
                    </tr>
                  )
                })}

              </tbody>

            </table>
          </div>
        )}

      </div>

    </div>
  )
}
