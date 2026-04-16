import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/components/Toast'
import type { ExamRecordStudentRow } from '@/utils/generateExamRecordPdf'
import { generateExamRecordExcel } from '@/utils/generateExamRecordExcel'
import { FileDown, Plus, Trash2 } from 'lucide-react'

const INSTITUTION = 'Instituto Superior de Informática Puerto Piray (ISIPP 1206)'

export const Route = createFileRoute('/admin/exam-records')({
  component: ExamRecordsAdminPage,
})

function ExamRecordsAdminPage() {
  const [records, setRecords] = useState<any[]>([])
  const [mesas, setMesas] = useState<any[]>([])
  const [mesaId, setMesaId] = useState('')
  const { showToast } = useToast()

  useEffect(() => {
    void load()
  }, [])

  async function load() {
    try {
      // Cargar actas
      const { data: recordsData } = await supabase
        .from('exam_records')
        .select('*, subject:subjects(name, code), professor:professors(name)')
        .order('created_at', { ascending: false })

      setRecords(recordsData ?? [])

      // Cargar mesas de examen
      const { data: mesasData, error: mesasError } = await supabase
        .from('final_exams')
        .select('*')
        .order('exam_date', { ascending: false })

      if (mesasError) {
        console.error('Error loading mesas:', mesasError)
        setMesas([])
        return
      }

      if (mesasData && mesasData.length > 0) {
        // Obtener IDs únicos de subjects
        const subjectIds = [...new Set(mesasData.map(m => m.subject_id).filter(Boolean))]
        
        let subjectsMap = new Map()
        
        if (subjectIds.length > 0) {
          // Obtener todos los subjects de una vez
          const { data: subjectsData } = await supabase
            .from('subjects')
            .select('id, name, code, year')
            .in('id', subjectIds)

          subjectsMap = new Map(subjectsData?.map(s => [s.id, s]) ?? [])
        }

        // Construir mesas con subject info
        const mesasWithSubjects = mesasData.map(m => ({
          ...m,
          subject: subjectsMap.get(m.subject_id) || { name: 'Materia desconocida', code: '—', year: 1 }
        }))

        setMesas(mesasWithSubjects)
      } else {
        setMesas([])
      }
    } catch (err) {
      console.error('Error loading:', err)
      showToast('Error cargando datos', 'error')
    }
  }

  async function buildRowsForMesa(exam: any): Promise<ExamRecordStudentRow[]> {
    const { data: regs } = await supabase
      .from('exam_enrollments')
      .select('student:students(id, legajo, first_name, last_name, dni)')
      .eq('final_exam_id', exam.id)

    const rows: ExamRecordStudentRow[] = []
    for (const r of regs ?? []) {
      const st = r.student as any
      if (!st?.id) continue
      const { data: enr } = await supabase
        .from('enrollments')
        .select('grades:grades(final_grade)')
        .eq('student_id', st.id)
        .eq('subject_id', exam.subject_id)
        .maybeSingle()
      const g = Array.isArray(enr?.grades) ? enr?.grades[0] : enr?.grades
      rows.push({
        legajo: st.legajo,
        nombre: `${st.last_name}, ${st.first_name}`,
        dni: st.dni,
        nota: g?.final_grade ?? null,
      })
    }
    return rows
  }

  async function crearActaDesdeMesa() {
    if (!mesaId) {
      showToast('Seleccioná una mesa de examen.', 'error')
      return
    }
    
    const mesa = mesas.find((m) => m.id === mesaId)
    if (!mesa) {
      showToast('Mesa no encontrada.', 'error')
      return
    }

    // Obtener subject info
    const { data: subject } = await supabase
      .from('subjects')
      .select('name, code, year, program_id')
      .eq('id', mesa.subject_id)
      .single()

    if (!subject) {
      showToast('Materia no encontrada.', 'error')
      return
    }

    // Obtener datos de presidente y vocales
    let presidentName = ''
    let vocal1Name = ''
    let vocal2Name = ''

    if (mesa.president_id) {
      const { data: pres } = await supabase
        .from('professors')
        .select('name')
        .eq('id', mesa.president_id)
        .single()
      presidentName = pres?.name || ''
    }

    if (mesa.vocal1_id) {
      const { data: v1 } = await supabase
        .from('professors')
        .select('name')
        .eq('id', mesa.vocal1_id)
        .single()
      vocal1Name = v1?.name || ''
    }

    if (mesa.vocal2_id) {
      const { data: v2 } = await supabase
        .from('professors')
        .select('name')
        .eq('id', mesa.vocal2_id)
        .single()
      vocal2Name = v2?.name || ''
    }

    const students = await buildRowsForMesa(mesa)
    const examDateIso = mesa.exam_date

    // Insertar acta en DB
    const { data: inserted, error } = await supabase
      .from('exam_records')
      .insert({
        subject_id: mesa.subject_id,
        professor_id: mesa.president_id,
        final_exam_id: mesa.id,
        exam_date: examDateIso,
        title: 'ACTA DE EXAMEN FINAL',
        students_grades: students,
        estado_acta: 'borrador',
        institution_id: mesa.institution_id ?? undefined,
      })
      .select('id')
      .single()

    if (error) {
      showToast(error.message, 'error')
      return
    }

    showToast('Acta generada en Excel.')
    void load()

    // Generar Excel
    if (inserted?.id) {
      const examDate = new Date(examDateIso).toLocaleDateString('es-AR')
      
      try {
        await generateExamRecordExcel({
          subjectName: subject.name,
          subjectYear: subject.year || 1,
          students,
          examDate,
          presidentName,
          vocal1Name,
          vocal2Name,
        })
      } catch (err) {
        console.error('Error generating Excel:', err)
        showToast('Error al generar Excel', 'error')
      }
    }
  }

  async function deleteRecord(id: string) {
    if (!confirm('¿Eliminar esta acta? No se puede deshacer.')) return

    const { error } = await supabase
      .from('exam_records')
      .delete()
      .eq('id', id)

    if (error) {
      showToast('Error al eliminar: ' + error.message, 'error')
      return
    }

    showToast('Acta eliminada.', 'info')
    void load()
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Actas de examen final</h1>
        <p className="mt-1 text-sm text-slate-600">
          Generá actas oficiales en Excel con alumnos inscriptos a la mesa de examen.
        </p>
      </div>

      <div className="card space-y-4 p-5">
        <h2 className="font-semibold">Nueva acta desde mesa</h2>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <label className="form-label">Mesa de examen</label>
            <select 
              className="form-input w-full" 
              value={mesaId} 
              onChange={(e) => setMesaId(e.target.value)}
            >
              <option value="">Seleccionar…</option>
              {mesas && mesas.length > 0 ? (
                mesas.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.subject?.name} · {new Date(m.exam_date).toLocaleDateString('es-AR')} {m.exam_time}
                  </option>
                ))
              ) : (
                <option disabled>No hay mesas disponibles</option>
              )}
            </select>
          </div>
          <button 
            type="button" 
            className="btn-primary flex items-center gap-2" 
            onClick={() => void crearActaDesdeMesa()}
            disabled={!mesaId}
          >
            <Plus size={18} />
            Crear acta Excel
          </button>
        </div>
      </div>

      <div className="card overflow-hidden p-0">
        <div className="border-b border-slate-100 px-5 py-3 font-semibold">Actas registradas</div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="table-header">
                <th className="px-4 py-2 text-left">Materia</th>
                <th className="px-4 py-2 text-left">Fecha</th>
                <th className="px-4 py-2 text-left">Estado</th>
                <th className="px-4 py-2 text-left">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {records && records.length > 0 ? (
                records.map((rec) => (
                  <tr key={rec.id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-2">{rec.subject?.name}</td>
                    <td className="px-4 py-2">{new Date(rec.exam_date).toLocaleString('es-AR')}</td>
                    <td className="px-4 py-2 capitalize">{rec.estado_acta}</td>
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => deleteRecord(rec.id)}
                          className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg"
                          title="Eliminar acta"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-slate-600">
                    No hay actas cargadas.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
