import jsPDF from "jspdf"

export function generateRegularCertificate(student: any, program: any) {

  const doc = new jsPDF()

  doc.setFontSize(18)
  doc.text("INSTITUTO SUPERIOR ISIPP", 105, 30, { align: "center" })

  doc.setFontSize(16)
  doc.text("CONSTANCIA DE ALUMNO REGULAR", 105, 45, { align: "center" })

  doc.setFontSize(12)

  const text = `
Se deja constancia que el/la estudiante:

${student.first_name} ${student.last_name}
DNI: ${student.dni}

es alumno/a regular de la carrera:

${program.name}

durante el ciclo lectivo ${new Date().getFullYear()}.

Se extiende la presente constancia a pedido del interesado
para los fines que estime corresponder.
`

  doc.text(text, 20, 70)

  doc.text("_________________________", 105, 150, { align: "center" })
  doc.text("Secretaría Académica", 105, 160, { align: "center" })

  doc.save(`constancia_regular_${student.last_name}.pdf`)
}