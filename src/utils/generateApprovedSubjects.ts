import jsPDF from "jspdf"

export function generateApprovedSubjects(student: any, subjects: any[]) {

  const doc = new jsPDF()

  doc.setFontSize(18)
  doc.text("INSTITUTO SUPERIOR ISIPP", 105, 30, { align: "center" })

  doc.setFontSize(16)
  doc.text("CONSTANCIA DE MATERIAS APROBADAS", 105, 45, { align: "center" })

  doc.setFontSize(12)

  doc.text(`Alumno: ${student.first_name} ${student.last_name}`, 20, 70)
  doc.text(`DNI: ${student.dni}`, 20, 80)

  let y = 100

  doc.text("Materias aprobadas:", 20, y)

  y += 10

  subjects.forEach((s) => {
    doc.text(`${s.name} — Nota: ${s.final_grade}`, 25, y)
    y += 10
  })

  doc.save(`materias_aprobadas_${student.last_name}.pdf`)
}