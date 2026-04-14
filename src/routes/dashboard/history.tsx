import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Download, CheckCircle, XCircle } from 'lucide-react'

export const Route = createFileRoute('/dashboard/history')({
  component: HistoryPage,
})

type ExamRecord = {
  id: string
  subject_id: string
  subject_name: string
  subject_code: string
  year: number
  final_grade: number
  created_at: string
  status: 'promoted' | 'passed'
  allows_promotion: boolean
}

function HistoryPage() {
  const [examRecords, setExamRecords] = useState<ExamRecord[]>([])
  const [student, setStudent] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    void loadData()
  }, [])

  async function loadData() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Obtener estudiante
      const { data: s } = await supabase
        .from('students')
        .select('*, program:programs(name)')
        .eq('user_id', user.id)
        .single()

      setStudent(s)
      if (!s) {
        setLoading(false)
        return
      }

      // QUERY ÚNICA CON JOIN: grades -> enrollments -> subjects
      const { data: grades, error: gradesError } = await supabase
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
        setLoading(false)
        return
      }

      if (grades && grades.length > 0) {
        const records: ExamRecord[] = []

        for (const grade of grades) {
          const enrollment = (grade as any).enrollments
          
          // Filtrar solo del estudiante actual
          if (!enrollment || enrollment.student_id !== s.id) continue

          const subject = enrollment.subjects
          if (!subject) continue

          // Validar nota final >= 6 y determinar status según allows_promotion
          const finalGrade = grade.final_grade ?? grade.final_grade_exam
          
          if (
            finalGrade !== null && 
            finalGrade !== undefined && 
            finalGrade >= 6
          ) {
            // Determinar status: Promocional solo si la materia permite Y nota >= 8
            // Si no permite promoción, siempre es Aprobado (si nota >= 6)
            let recordStatus: 'promoted' | 'passed' = 'passed'
            if (subject.allows_promotion && finalGrade >= 8) {
              recordStatus = 'promoted'
            }
            
            records.push({
              id: grade.id,
              subject_id: subject.id,
              subject_name: subject.name,
              subject_code: subject.code,
              year: subject.year,
              final_grade: finalGrade,
              created_at: grade.created_at,
              status: recordStatus,
              allows_promotion: subject.allows_promotion
            })
          }
        }

        // Ordenar por año, luego por fecha
        records.sort((a, b) => {
          if (a.year !== b.year) return a.year - b.year
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        })

        setExamRecords(records)
      }

      setLoading(false)
    } catch (err) {
      console.error('Error in loadData:', err)
      setLoading(false)
    }
  }

  const handlePrint = () => window.print()

  // Agrupar por año
  const byYear: Record<number, ExamRecord[]> = {}
  examRecords.forEach(record => {
    if (!byYear[record.year]) byYear[record.year] = []
    byYear[record.year].push(record)
  })

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return new Intl.DateTimeFormat('es-AR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Historial Académico</h1>
          <p className="text-gray-500 text-sm mt-1">Finales aprobados (nota ≥ 6)</p>
        </div>
        <button
          type="button"
          onClick={handlePrint}
          className="btn-primary flex items-center gap-2"
          title="Abre el diálogo de impresión del navegador (puede guardar como PDF)"
        >
          <Download size={16} /> Imprimir / guardar PDF
        </button>
      </div>

      {student && (
        <div className="card">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Alumno:</span>
              <p className="font-semibold">{student.first_name} {student.last_name}</p>
            </div>
            <div>
              <span className="text-gray-500">Legajo:</span>
              <p className="font-semibold">{student.legajo}</p>
            </div>
            <div>
              <span className="text-gray-500">DNI:</span>
              <p className="font-semibold">{student.dni}</p>
            </div>
            <div>
              <span className="text-gray-500">Carrera:</span>
              <p className="font-semibold">{student.program?.name || '-'}</p>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="card animate-pulse h-64 bg-gray-100" />
      ) : Object.keys(byYear).length === 0 ? (
        <div className="card p-6 text-center">
          <p className="text-gray-500">Aún no hay finales aprobados en tu historial.</p>
        </div>
      ) : (
        Object.keys(byYear)
          .sort((a, b) => parseInt(a) - parseInt(b))
          .map(year => (
            <div key={year} className="card p-0 overflow-hidden">
              <div className="siu-band-header">
                <h3 className="text-sm font-bold tracking-wide text-white">{year}° Año</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 text-xs text-gray-600 border-b border-gray-200">
                      <th className="px-4 py-3 text-left font-semibold">Materia</th>
                      <th className="px-4 py-3 text-left font-semibold">Código</th>
                      <th className="px-4 py-3 text-center font-semibold">Nota</th>
                      <th className="px-4 py-3 text-left font-semibold">Resultado</th>
                      <th className="px-4 py-3 text-left font-semibold">Fecha</th>
                    </tr>
                  </thead>
                  <tbody>
                    {byYear[year].map((record) => (
                      <tr key={record.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-900">
                          {record.subject_name}
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {record.subject_code}
                        </td>
                        <td className="px-4 py-3 text-center font-bold text-lg">
                          {record.final_grade}
                        </td>
                        <td className="px-4 py-3">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              {record.status === 'promoted' ? (
                                <>
                                  <CheckCircle size={18} className="text-green-700" />
                                  <span className="font-semibold text-green-700">Promocional</span>
                                </>
                              ) : (
                                <>
                                  <CheckCircle size={18} className="text-emerald-600" />
                                  <span className="font-semibold text-emerald-700">Aprobado</span>
                                </>
                              )}
                            </div>
                            {!record.allows_promotion && (
                              <p className="text-xs text-slate-500 italic">Sin promoción</p>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {formatDate(record.created_at)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))
      )}
    </div>
  )
}
