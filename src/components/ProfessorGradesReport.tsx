import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { AlertCircle, Download, FileText } from 'lucide-react'

type Subject = {
  id: string
  name: string
  code: string
}

type GradeReport = {
  student_name: string
  legajo: string
  grade_1?: number
  grade_1_label?: string
  grade_2?: number
  grade_2_label?: string
  grade_3?: number
  grade_3_label?: string
  grade_4?: number
  grade_4_label?: string
  grade_5?: number
  grade_5_label?: string
  grade_6?: number
  grade_6_label?: string
  partial_grade?: number
  partial_status?: string
  selected_grades: number[]
}

type Props = {
  subjectId: string
}

export function ProfessorGradesReport({ subjectId }: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [subject, setSubject] = useState<Subject | null>(null)
  const [gradesReport, setGradesReport] = useState<GradeReport[]>([])
  const [totalGrades, setTotalGrades] = useState(0)

  useEffect(() => {
    void loadSubjectAndReport()
  }, [subjectId])

  const loadSubjectAndReport = async () => {
    setLoading(true)
    setError('')

    try {
      // Obtener info de materia
      const { data: subjectData, error: subjError } = await supabase
        .from('subjects')
        .select('id, name, code')
        .eq('id', subjectId)
        .single()

      if (subjError) {
        setError('Error al cargar materia')
        setLoading(false)
        return
      }

      setSubject(subjectData)

      // Obtener notas finalizadas
      const { data: gradesData, error: gradesError } = await supabase
        .from('enrollment_grades')
        .select(`
          enrollment_id,
          grade_1, grade_2, grade_3, grade_4, grade_5, grade_6,
          grade_labels,
          partial_grade, partial_status,
          selected_grades_for_averaging,
          partial_finalized,
          enrollments(
            id,
            student_id,
            students(
              id, first_name, last_name, legajo
            )
          )
        `)
        .eq('partial_finalized', true)
        .in('enrollment_id', 
          await supabase
            .from('enrollments')
            .select('id')
            .eq('subject_id', subjectId)
            .then(res => res.data?.map(e => e.id) || [])
        )

      if (gradesError) {
        console.error('Error fetching grades:', gradesError)
        setError(`Error al cargar calificaciones: ${gradesError.message}`)
        setLoading(false)
        return
      }

      // Procesar datos
      const processedGrades: GradeReport[] = (gradesData || []).map((grade: any) => {
        const studentName = `${grade.enrollments?.students?.last_name}, ${grade.enrollments?.students?.first_name}`
        const legajo = grade.enrollments?.students?.legajo || '-'

        const labels = grade.grade_labels ? 
          (typeof grade.grade_labels === 'string' ? JSON.parse(grade.grade_labels) : grade.grade_labels)
          : {}

        const selectedGrades = grade.selected_grades_for_averaging || []

        return {
          student_name: studentName,
          legajo,
          grade_1: grade.grade_1 || undefined,
          grade_1_label: labels.grade_1,
          grade_2: grade.grade_2 || undefined,
          grade_2_label: labels.grade_2,
          grade_3: grade.grade_3 || undefined,
          grade_3_label: labels.grade_3,
          grade_4: grade.grade_4 || undefined,
          grade_4_label: labels.grade_4,
          grade_5: grade.grade_5 || undefined,
          grade_5_label: labels.grade_5,
          grade_6: grade.grade_6 || undefined,
          grade_6_label: labels.grade_6,
          partial_grade: grade.partial_grade,
          partial_status: grade.partial_status,
          selected_grades: selectedGrades,
        }
      })

      setGradesReport(processedGrades)
      setTotalGrades(processedGrades.length)
    } catch (err) {
      console.error('Error:', err)
      setError('Error inesperado: ' + String(err))
    } finally {
      setLoading(false)
    }
  }

  const generateExcel = () => {
    if (gradesReport.length === 0) {
      alert('No hay notas finalizadas para exportar')
      return
    }

    // Crear CSV
    let csv = 'REPORTE DE CALIFICACIONES FINALIZADAS\n'
    csv += `Materia: ${subject?.code} - ${subject?.name}\n`
    csv += `Fecha de generación: ${new Date().toLocaleDateString()}\n\n`

    csv += 'Legajo,Estudiante,Nota 1,Tipo 1,Nota 2,Tipo 2,Nota 3,Tipo 3,Nota 4,Tipo 4,Nota 5,Tipo 5,Nota 6,Tipo 6,Promedio Parcial,Estado Parcial,Notas Utilizadas\n'

    gradesReport.forEach(grade => {
      const notasUtilizadas = grade.selected_grades.join(';')
      
      csv += `"${grade.legajo}","${grade.student_name}",`
      csv += `${grade.grade_1 ?? ''},${grade.grade_1_label ?? ''},`
      csv += `${grade.grade_2 ?? ''},${grade.grade_2_label ?? ''},`
      csv += `${grade.grade_3 ?? ''},${grade.grade_3_label ?? ''},`
      csv += `${grade.grade_4 ?? ''},${grade.grade_4_label ?? ''},`
      csv += `${grade.grade_5 ?? ''},${grade.grade_5_label ?? ''},`
      csv += `${grade.grade_6 ?? ''},${grade.grade_6_label ?? ''},`
      csv += `${grade.partial_grade ?? ''},${grade.partial_status ?? ''},`
      csv += `"${notasUtilizadas}"\n`
    })

    // Descargar
    const element = document.createElement('a')
    element.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv))
    element.setAttribute('download', `calificaciones_${subject?.code}_${new Date().getTime()}.csv`)
    element.style.display = 'none'
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
  }

  const getStatusColor = (status: string) => {
    if (status === 'promocionado') return 'bg-green-100 text-green-700'
    if (status === 'regular') return 'bg-yellow-100 text-yellow-700'
    return 'bg-red-100 text-red-700'
  }

  const getStatusLabel = (status: string) => {
    if (status === 'promocionado') return 'Promocional'
    if (status === 'regular') return 'Regular'
    return 'Desaprobado'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card p-6 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl text-white">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-emerald-100 text-sm font-semibold mb-2">Reportes</p>
            <h2 className="text-4xl font-black mb-2">Reporte de Notas Finalizadas</h2>
            <p className="text-emerald-100">
              Listado de alumnos con notas parciales cerradas y promedios calculados
            </p>
          </div>
          <FileText size={70} className="opacity-30" />
        </div>
      </div>

      {/* Info Card */}
      <div className="card p-4 bg-blue-50 border-2 border-blue-200">
        <h3 className="font-bold text-blue-900 mb-2">Información del Reporte</h3>
        <p className="text-sm text-blue-900 mb-2">
          Este reporte muestra todos los alumnos cuyas notas parciales han sido <strong>finalizadas</strong>. 
          Incluye el desglose de notas cargadas, tipos asignados, promedio parcial y estado académico.
        </p>
        <p className="text-sm text-blue-700">
          <strong>Total de alumnos con notas finalizadas:</strong> {totalGrades}
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 bg-red-50 border-2 border-red-200 text-red-700 rounded-lg flex gap-2">
          <AlertCircle size={20} className="flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Error</p>
            <p className="text-sm mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="card p-8 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-emerald-200 border-t-emerald-600 mb-4"></div>
          <p className="text-slate-600">Cargando reporte...</p>
        </div>
      )}

      {/* Content */}
      {!loading && gradesReport.length === 0 && (
        <div className="card p-8 text-center bg-gray-50 border-2 border-gray-200">
          <FileText size={48} className="mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600 font-semibold mb-2">No hay notas finalizadas aún</p>
          <p className="text-sm text-gray-500">
            Una vez que finalices notas parciales (con "Cerrar Notas"), aparecerán aquí
          </p>
        </div>
      )}

      {!loading && gradesReport.length > 0 && (
        <>
          {/* Tabla */}
          <div className="card p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white">
                    <th className="px-4 py-3 text-left font-bold">Legajo</th>
                    <th className="px-4 py-3 text-left font-bold">Estudiante</th>
                    <th className="px-4 py-3 text-center font-bold">Notas Cargadas</th>
                    <th className="px-4 py-3 text-center font-bold">Promedio</th>
                    <th className="px-4 py-3 text-center font-bold">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {gradesReport.map((grade, idx) => {
                    const loadedNotes: Array<{ num: number; value: number; label?: string }> = []
                    for (let i = 1; i <= 6; i++) {
                      const value = grade[`grade_${i}` as keyof typeof grade]
                      if (typeof value === 'number') {
                        loadedNotes.push({
                          num: i,
                          value,
                          label: grade[`grade_${i}_label` as keyof typeof grade] as string
                        })
                      }
                    }

                    return (
                      <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="px-4 py-3 font-semibold text-gray-900">{grade.legajo}</td>
                        <td className="px-4 py-3 text-gray-900">{grade.student_name}</td>
                        <td className="px-4 py-3">
                          <div className="space-y-1">
                            {loadedNotes.map(note => (
                              <div key={note.num} className="text-xs bg-blue-50 p-1 rounded">
                                <span className="font-semibold">{note.label || `Nota ${note.num}`}</span>
                                <span className="ml-2">{note.value}</span>
                                {grade.selected_grades.includes(note.num) && (
                                  <span className="ml-2 px-2 py-0.5 bg-green-200 text-green-700 rounded text-xs font-bold">
                                    Usada
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center font-bold text-lg text-gray-900">
                          {grade.partial_grade?.toFixed(1)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span
                            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(
                              grade.partial_status || ''
                            )}`}
                          >
                            {getStatusLabel(grade.partial_status || '')}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Botón Descargar */}
          <div className="flex justify-end">
            <button
              onClick={generateExcel}
              className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:shadow-lg text-white font-bold py-3 px-6 rounded-lg transition-all flex items-center justify-center gap-2"
            >
              <Download size={20} />
              Descargar como CSV
            </button>
          </div>

          {/* Resumen */}
          <div className="grid grid-cols-3 gap-4">
            <div className="card p-4 bg-green-50 border-2 border-green-200">
              <p className="text-sm text-green-700 font-semibold mb-1">Promocionales</p>
              <p className="text-2xl font-bold text-green-700">
                {gradesReport.filter(g => g.partial_status === 'promocionado').length}
              </p>
            </div>
            <div className="card p-4 bg-yellow-50 border-2 border-yellow-200">
              <p className="text-sm text-yellow-700 font-semibold mb-1">Regulares</p>
              <p className="text-2xl font-bold text-yellow-700">
                {gradesReport.filter(g => g.partial_status === 'regular').length}
              </p>
            </div>
            <div className="card p-4 bg-red-50 border-2 border-red-200">
              <p className="text-sm text-red-700 font-semibold mb-1">Desaprobados</p>
              <p className="text-2xl font-bold text-red-700">
                {gradesReport.filter(g => g.partial_status === 'desaprobado').length}
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
