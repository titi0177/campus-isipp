export type ExamRecordStudentRow = {
  legajo: string
  dni?: string
  nombre: string
  nota: string | number | null
}

/**
 * Lazy-loaded PDF generation - imported dynamically to reduce initial bundle
 */
export async function generateExamRecordPdf(params: {
  title: string
  institution: string
  career?: string
  subjectName: string
  subjectCode?: string
  examDate: string
  professorName?: string
  students: ExamRecordStudentRow[]
}) {
  // Lazy load jsPDF only when needed
  const { default: jsPDF } = await import('jspdf')
  
  const doc = new jsPDF()
  let y = 22

  doc.setFontSize(16)
  doc.text(params.institution, 105, y, { align: 'center' })
  y += 10
  doc.setFontSize(14)
  doc.text(params.title, 105, y, { align: 'center' })
  y += 12
  doc.setFontSize(10)
  doc.text(`Materia: ${params.subjectName}${params.subjectCode ? ` (${params.subjectCode})` : ''}`, 14, y)
  y += 6
  if (params.career) {
    doc.text(`Carrera / plan: ${params.career}`, 14, y)
    y += 6
  }
  doc.text(`Fecha y hora: ${params.examDate}`, 14, y)
  y += 6
  doc.text(`Docente responsable: ${params.professorName ?? '—'}`, 14, y)
  y += 10

  doc.setFontSize(9)
  doc.text('Alumnos inscriptos y calificación final registrada', 14, y)
  y += 6

  // Tabla header
  doc.setFillColor(240, 240, 240)
  const headerHeight = 7
  doc.rect(14, y - 4, 182, headerHeight, 'F')
  
  doc.setFontSize(8)
  doc.text('Legajo', 16, y)
  doc.text('Apellido y nombre', 35, y)
  doc.text('DNI', 145, y)
  doc.text('Nota', 175, y)
  y += headerHeight + 2

  doc.setFontSize(9)
  for (const s of params.students) {
    const rowHeight = 6
    
    if (y + rowHeight > 270) {
      doc.addPage()
      y = 20
    }
    
    // Legajo
    doc.text(String(s.legajo), 16, y)
    
    // Nombre (puede ocupar múltiples líneas)
    const nameText = doc.splitTextToSize(s.nombre, 105)
    doc.text(nameText, 35, y)
    
    // DNI
    doc.text(s.dni ? String(s.dni) : '—', 145, y)
    
    // Nota
    doc.text(s.nota != null && s.nota !== '' ? String(s.nota) : '—', 175, y)
    
    y += Math.max(rowHeight, nameText.length * 4) + 1
  }

  y += 14
  doc.setFontSize(9)
  doc.text('Firma del docente: _______________________________', 14, y)
  y += 10
  doc.text('Firma y sello institucional: _______________________________', 14, y)
  y += 10
  doc.setFontSize(8)
  doc.text(
    'Documento generado desde el sistema académico ISIPP. Validez sujeta a registro en Secretaría.',
    14,
    y,
    { maxWidth: 180 },
  )

  doc.save(`acta_examen_${params.subjectCode ?? 'materia'}.pdf`)
}
