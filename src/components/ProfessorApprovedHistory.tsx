import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Download, Filter } from 'lucide-react'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

type ApprovedStudent = {
  id: string
  enrollment_id: string
  student_name: string
  legajo: string
  dni: string
  partial_grade: number
  partial_status: string
  final_grade: number | null
  final_status: string | null
  created_at: string
}

type Props = {
  subjectId: string
  subjectName: string
}

export function ProfessorApprovedHistory({ subjectId, subjectName }: Props) {
  const [students, setStudents] = useState<ApprovedStudent[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState<string>('all')

  useEffect(() => {
    loadApprovedStudents()
  }, [subjectId])

  const loadApprovedStudents = async () => {
    try {
      // Obtener alumnos con calificación parcial/final
      const { data, error } = await supabase
        .from('enrollment_grades')
        .select(`
          id,
          enrollment_id,
          partial_grade,
          partial_status,
          final_grade,
          final_status,
          created_at,
          enrollments!inner(
            id,
            student:students(first_name, last_name, legajo, dni),
            subject_id
          )
        `)
        .eq('enrollments.subject_id', subjectId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error loading approved students:', error)
        setLoading(false)
        return
      }

      if (data) {
        const formatted = data.map((r: any) => ({
          id: r.id,
          enrollment_id: r.enrollment_id,
          student_name: `${r.enrollments.student.last_name}, ${r.enrollments.student.first_name}`,
          legajo: r.enrollments.student.legajo || 'S/N',
          dni: r.enrollments.student.dni || 'S/N',
          partial_grade: r.partial_grade,
          partial_status: r.partial_status,
          final_grade: r.final_grade,
          final_status: r.final_status,
          created_at: r.created_at,
        }))
        setStudents(formatted)
      }

      setLoading(false)
    } catch (err) {
      console.error('Error:', err)
      setLoading(false)
    }
  }

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case 'promocionado':
        return 'bg-green-100 text-green-800'
      case 'aprobado':
        return 'bg-blue-100 text-blue-800'
      case 'regular':
        return 'bg-yellow-100 text-yellow-800'
      case 'desaprobado':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusLabel = (status: string | null) => {
    switch (status) {
      case 'promocionado':
        return '✓ Promocionado'
      case 'aprobado':
        return '✓ Aprobado'
      case 'regular':
        return '⚬ Regular'
      case 'desaprobado':
        return '✗ Desaprobado'
      default:
        return '-'
    }
  }

  const filteredStudents = students.filter(s => {
    if (filterStatus === 'all') return true
    if (filterStatus === 'approved') return s.final_status && ['aprobado', 'promocionado'].includes(s.final_status)
    if (filterStatus === 'disapproved') return s.final_status === 'desaprobado'
    if (filterStatus === 'regular') return s.partial_status === 'regular' && !s.final_status
    return true
  })

  const generatePDF = () => {
    const doc = new jsPDF('p')
    const currentDate = new Date().toLocaleDateString('es-AR')

    doc.setFontSize(16)
    doc.text('HISTORIAL DE CALIFICACIONES', 105, 15, { align: 'center' })

    doc.setFontSize(11)
    doc.text(`Materia: ${subjectName}`, 14, 25)
    doc.text(`Generado: ${currentDate}`, 14, 31)

    const tableData = filteredStudents.map(s => [
      s.legajo,
      s.student_name,
      s.partial_grade.toFixed(1),
      s.partial_status || '-',
      s.final_grade ? s.final_grade.toFixed(1) : '-',
      s.final_status ? getStatusLabel(s.final_status) : (s.partial_status ? getStatusLabel(s.partial_status) : '-'),
    ])

    autoTable(doc, {
      head: [['Legajo', 'Alumno', 'Prom. Parcial', 'Est. Parcial', 'Nota Final', 'Estado Final']],
      body: tableData,
      startY: 40,
      margin: 10,
      headStyles: { fillColor: [51, 65, 85], fontSize: 10 },
      bodyStyles: { fontSize: 9 },
      alternateRowStyles: { fillColor: [240, 240, 240] },
    })

    doc.save(`historial_calificaciones_${subjectName.replace(/\s+/g, '_')}.pdf`)
  }

  if (loading) {
    return (
      <div className="card p-6 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-indigo-200 border-t-indigo-600 mb-4"></div>
        <p className="text-slate-600">Cargando historial...</p>
      </div>
    )
  }

  if (students.length === 0) {
    return (
      <div className="card p-8 text-center bg-gradient-to-br from-slate-50 to-slate-100 border-2 border-slate-200 rounded-2xl">
        <p className="text-slate-600 font-semibold">No hay calificaciones registradas aún</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <div className="card p-4 bg-gradient-to-r from-indigo-50 to-purple-50 border-2 border-indigo-200">
        <div className="flex items-center gap-3 mb-3">
          <Filter size={20} className="text-indigo-600" />
          <h3 className="font-bold text-gray-900">Filtrar por Estado</h3>
        </div>
        <div className="flex gap-2 flex-wrap">
          {[
            { value: 'all', label: 'Todos' },
            { value: 'approved', label: 'Aprobados/Promocionados' },
            { value: 'disapproved', label: 'Desaprobados' },
            { value: 'regular', label: 'En condición Regular' },
          ].map(opt => (
            <button
              key={opt.value}
              onClick={() => setFilterStatus(opt.value)}
              className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                filterStatus === opt.value
                  ? 'bg-indigo-600 text-white shadow-lg'
                  : 'bg-white text-gray-700 border-2 border-gray-300 hover:border-indigo-600'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Info Box */}
      <div className="card p-4 bg-blue-50 border-2 border-blue-200">
        <p className="text-sm text-blue-900">
          <strong>📊 Total: {filteredStudents.length}</strong> estudiante{filteredStudents.length !== 1 ? 's' : ''} con calificación registrada
        </p>
      </div>

      {/* Tabla */}
      <div className="card p-0 overflow-hidden rounded-2xl border-2 border-indigo-200 shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
                <th className="px-4 py-3 text-left font-bold">Legajo</th>
                <th className="px-4 py-3 text-left font-bold">Alumno</th>
                <th className="px-4 py-3 text-left font-bold">DNI</th>
                <th className="px-4 py-3 text-center font-bold">Prom. Parcial</th>
                <th className="px-4 py-3 text-center font-bold">Est. Parcial</th>
                <th className="px-4 py-3 text-center font-bold">Nota Final</th>
                <th className="px-4 py-3 text-center font-bold">Estado Final</th>
                <th className="px-4 py-3 text-center font-bold">Fecha Carga</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredStudents.map((student, idx) => {
                const finalStatus = student.final_status || student.partial_status
                return (
                  <tr key={student.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-4 py-3 font-semibold text-gray-900">{student.legajo}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{student.student_name}</td>
                    <td className="px-4 py-3 text-gray-600">{student.dni}</td>
                    <td className="px-4 py-3 text-center font-bold text-gray-900">
                      {student.partial_grade && !isNaN(student.partial_grade) ? student.partial_grade.toFixed(1) : '—'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex px-2 py-1 rounded-full text-xs font-bold ${getStatusColor(student.partial_status)}`}>
                        {getStatusLabel(student.partial_status)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center font-bold text-gray-900">
                      {student.final_grade ? student.final_grade.toFixed(1) : '—'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {finalStatus && (
                        <span className={`inline-flex px-2 py-1 rounded-full text-xs font-bold ${getStatusColor(finalStatus)}`}>
                          {getStatusLabel(finalStatus)}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center text-xs text-gray-600">
                      {new Date(student.created_at).toLocaleDateString('es-AR')}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Botón Descargar */}
      <button
        onClick={generatePDF}
        className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:shadow-lg text-white font-bold py-3 rounded-lg transition-all flex items-center justify-center gap-2"
      >
        <Download size={20} />
        Descargar Historial en PDF
      </button>
    </div>
  )
}
