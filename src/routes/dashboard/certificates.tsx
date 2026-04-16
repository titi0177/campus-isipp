import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { generateAnalytico, generateConstancia, generateApprovedCertificate, StudentData, GradeData, getCondicion } from '@/lib/certificatosUtil'
import { Award, FileText, Loader } from 'lucide-react'

export const Route = createFileRoute('/dashboard/certificates')({
  component: CertificatesPage,
})

function CertificatesPage() {
  const [student, setStudent] = useState<StudentData | null>(null)
  const [studentId, setStudentId] = useState<string>('')
  const [grades, setGrades] = useState<GradeData[]>([])
  const [loading, setLoading] = useState(true)
  const [hasApprovedSubjects, setHasApprovedSubjects] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setLoading(false)
        return
      }

      // Obtener datos del estudiante
      const { data: studentData } = await supabase
        .from('students')
        .select('id, first_name, last_name, dni, legajo, year, program:programs(name), email')
        .eq('user_id', user.id)
        .single()

      if (studentData) {
        setStudentId(studentData.id)
        setStudent({
          nombre: studentData.first_name,
          apellido: studentData.last_name,
          dni: studentData.dni,
          legajo: studentData.legajo,
          carrera: (studentData.program as any)?.name || '',
          año: studentData.year,
          email: studentData.email,
        })

        // Obtener calificaciones finales aprobadas
        const { data: enrollmentsData } = await supabase
          .from('enrollments')
          .select(`
            id,
            subject:subjects(code, name, year),
            grades(final_grade_exam, status)
          `)
          .eq('student_id', studentData.id)

        if (enrollmentsData && enrollmentsData.length > 0) {
          const approvedGrades: GradeData[] = []

          for (const enrollment of enrollmentsData) {
            const grade = Array.isArray(enrollment.grades) 
              ? enrollment.grades[0] 
              : enrollment.grades
            
            if (grade && grade.final_grade_exam && grade.final_grade_exam >= 6) {
              approvedGrades.push({
                codigo: (enrollment.subject as any)?.code || '',
                materia: (enrollment.subject as any)?.name || '',
                parcial: null,
                final: grade.final_grade_exam,
                estado: 'REGULAR',
                condicion: 'APROBADO',
                año: (enrollment.subject as any)?.year || 1,
              })
            }
          }

          setGrades(approvedGrades)
          setHasApprovedSubjects(approvedGrades.length > 0)
        }
      }
    } catch (err) {
      console.error('Error loading data:', err)
    } finally {
      setLoading(false)
    }
  }

  async function handleDownloadApprovedCertificate() {
    if (!studentId || !student) {
      alert('Error: No se encontró la información del estudiante')
      return
    }

    try {
      // Obtener calificaciones aprobadas (igual que historial)
      const { data: gradesData, error: gradesError } = await supabase
        .from('grades')
        .select(`
          id,
          final_grade,
          final_grade_exam,
          created_at,
          status,
          enrollment_id,
          enrollments!inner(
            student_id,
            subject_id,
            subjects!inner(id, name, code, year, allows_promotion)
          )
        `)

      if (gradesError) {
        console.error('Error fetching grades:', gradesError)
        alert('Error al descargar el certificado')
        return
      }

      if (!gradesData || gradesData.length === 0) {
        alert('No hay calificaciones registradas')
        return
      }

      const approvedGrades: GradeData[] = []

      for (const grade of gradesData) {
        const enrollment = (grade as any).enrollments
        
        // Filtrar solo del estudiante actual
        if (!enrollment || enrollment.student_id !== studentId) continue

        const subject = enrollment.subjects
        if (!subject) continue

        // Validar nota final >= 6
        const finalGrade = grade.final_grade ?? grade.final_grade_exam
        
        if (
          finalGrade !== null && 
          finalGrade !== undefined && 
          finalGrade >= 6
        ) {
          const condicion = getCondicion(finalGrade, subject.allows_promotion)

          approvedGrades.push({
            id: grade.id,
            codigo: subject.code,
            materia: subject.name,
            parcial: null,
            final: finalGrade,
            estado: grade.status === 'promoted' ? 'PROMOCIONADO' : 'REGULAR',
            condicion,
            año: subject.year,
            created_at: grade.created_at,
            allows_promotion: subject.allows_promotion,
          })
        }
      }

      // Ordenar por año, luego por fecha
      approvedGrades.sort((a, b) => {
        if (a.año !== b.año) return a.año - b.año
        return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
      })

      generateApprovedCertificate(student, approvedGrades)
    } catch (err) {
      console.error('Error downloading certificado:', err)
      alert('Error al descargar el certificado')
    }
  }

  async function handleDownloadAnalytico() {
    if (!studentId || !student) {
      alert('Error: No se encontró la información del estudiante')
      return
    }

    try {
      // Obtener todas las calificaciones para el analítico (igual que historial)
      const { data: gradesData, error: gradesError } = await supabase
        .from('grades')
        .select(`
          id,
          final_grade,
          final_grade_exam,
          created_at,
          status,
          enrollment_id,
          enrollments!inner(
            student_id,
            subject_id,
            subjects!inner(id, name, code, year, allows_promotion)
          )
        `)

      if (gradesError) {
        console.error('Error fetching grades:', gradesError)
        alert('Error al descargar el analítico')
        return
      }

      if (!gradesData || gradesData.length === 0) {
        alert('No hay calificaciones registradas')
        return
      }

      const allGrades: GradeData[] = []

      for (const grade of gradesData) {
        const enrollment = (grade as any).enrollments
        
        // Filtrar solo del estudiante actual
        if (!enrollment || enrollment.student_id !== studentId) continue

        const subject = enrollment.subjects
        if (!subject) continue

        // Validar nota final >= 6
        const finalGrade = grade.final_grade ?? grade.final_grade_exam
        
        if (
          finalGrade !== null && 
          finalGrade !== undefined && 
          finalGrade >= 6
        ) {
          const condicion = getCondicion(finalGrade, subject.allows_promotion)

          allGrades.push({
            id: grade.id,
            codigo: subject.code,
            materia: subject.name,
            parcial: null,
            final: finalGrade,
            estado: grade.status === 'promoted' ? 'PROMOCIONADO' : 'REGULAR',
            condicion,
            año: subject.year,
            created_at: grade.created_at,
            allows_promotion: subject.allows_promotion,
          })
        }
      }

      // Ordenar por año, luego por fecha
      allGrades.sort((a, b) => {
        if (a.año !== b.año) return a.año - b.año
        return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
      })

      generateAnalytico(student, allGrades)
    } catch (err) {
      console.error('Error downloading analítico:', err)
      alert('Error al descargar el analítico')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <Loader className="animate-spin h-8 w-8 mx-auto text-indigo-600 mb-4" />
          <p className="text-gray-600">Cargando certificados...</p>
        </div>
      </div>
    )
  }

  if (!student) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-gray-600">No se encontraron datos del estudiante</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-3xl p-8 text-white shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-indigo-100 text-sm font-semibold mb-2">Documentación Académica</p>
            <h1 className="text-5xl font-black mb-3">Mis Certificados</h1>
            <p className="text-indigo-100 text-lg">Descarga tus certificados y constancias académicas</p>
          </div>
          <Award size={80} className="opacity-20" />
        </div>
      </div>

      {/* Información del Alumno */}
      <div className="card p-6 bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-indigo-200">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Datos del Alumno</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600 font-semibold">Nombre</p>
            <p className="text-lg font-bold text-gray-900">{student.apellido.toUpperCase()} {student.nombre.toUpperCase()}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 font-semibold">DNI</p>
            <p className="text-lg font-bold text-gray-900">{student.dni}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 font-semibold">Legajo</p>
            <p className="text-lg font-bold text-gray-900">{student.legajo}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 font-semibold">Carrera</p>
            <p className="text-lg font-bold text-gray-900">{student.carrera}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 font-semibold">Año Actual</p>
            <p className="text-lg font-bold text-gray-900">{student.año}°</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 font-semibold">Email</p>
            <p className="text-lg font-bold text-gray-900">{student.email}</p>
          </div>
        </div>
      </div>

      {/* Certificados disponibles */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Constancia de Alumno Regular */}
        <div className="card p-8 rounded-2xl border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 hover:shadow-lg transition-shadow">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h3 className="text-2xl font-black text-gray-900 mb-2">Constancia de Alumno Regular</h3>
              <p className="text-sm text-gray-600">Certifica tu estado de alumno regular en el instituto</p>
            </div>
            <FileText size={40} className="text-green-600 opacity-30" />
          </div>

          <button
            onClick={() => generateConstancia(student)}
            className="w-full btn-primary flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700"
          >
            <FileText size={18} />
            Descargar PDF
          </button>
        </div>

        {/* Analítico de Calificaciones */}
        <div className="card p-8 rounded-2xl border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 hover:shadow-lg transition-shadow">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h3 className="text-2xl font-black text-gray-900 mb-2">Analítico de Calificaciones</h3>
              <p className="text-sm text-gray-600">Histórico completo de todas tus calificaciones</p>
            </div>
            <FileText size={40} className="text-blue-600 opacity-30" />
          </div>

          <button
            onClick={handleDownloadAnalytico}
            className="w-full btn-primary flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700"
          >
            <FileText size={18} />
            Descargar PDF
          </button>
        </div>

        {/* Certificado de Materias Aprobadas */}
        {hasApprovedSubjects && (
          <div className="card p-8 rounded-2xl border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50 hover:shadow-lg transition-shadow md:col-span-2">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h3 className="text-2xl font-black text-gray-900 mb-2">Certificado de Materias Aprobadas</h3>
                <p className="text-sm text-gray-600">Listado completo de materias aprobadas con calificaciones y fechas</p>
              </div>
              <Award size={40} className="text-purple-600 opacity-30" />
            </div>

            <button
              onClick={handleDownloadApprovedCertificate}
              className="w-full btn-primary flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700"
            >
              <FileText size={18} />
              Descargar PDF ({grades.length} materias)
            </button>
          </div>
        )}
      </div>

      {/* Info Box */}
      <div className="card p-6 bg-amber-50 border-2 border-amber-200 rounded-xl">
        <h3 className="font-bold text-amber-900 mb-3 flex items-center gap-2">
          ℹ️ Información Importante
        </h3>
        <ul className="text-sm text-amber-900 space-y-2 list-disc list-inside">
          <li><strong>Constancia de Alumno Regular:</strong> Acredita tu condición de alumno activo en el instituto</li>
          <li><strong>Analítico de Calificaciones:</strong> Documento con todas tus notas parciales y finales</li>
          <li><strong>Certificado de Materias Aprobadas:</strong> Listado de materias aprobadas con fecha de aprobación</li>
          <li>Los certificados son válidos para presentar ante autoridades que los requieran</li>
          <li>Se generan automáticamente con la fecha actual de emisión</li>
        </ul>
      </div>
    </div>
  )
}
