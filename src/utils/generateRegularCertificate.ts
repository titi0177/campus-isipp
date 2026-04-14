import jsPDF from "jspdf"

export function generateRegularCertificate(student: any, program: any) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  })

  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()

  // Color bordo/marrón del instituto
  const bordeColor = [88, 44, 49]
  const leftMargin = 20
  const firstLineIndent = 7 // Sangría de primera línea

  // ===== ENCABEZADO (Sin fondo de color) =====
  doc.setTextColor(bordeColor[0], bordeColor[1], bordeColor[2])
  doc.setFont('Arial', 'bold')
  doc.setFontSize(10)
  doc.text('INSTITUTO SUPERIOR DE INFORMÁTICA (1206)', leftMargin, 12)
  
  doc.setFont('Arial', 'normal')
  doc.setFontSize(8)
  doc.text('FUNDACIÓN NUESTRA SEÑORA DE LOS MILAGROS', leftMargin, 17)
  doc.text('(Personería Jurídica A-4954)', leftMargin, 21)
  
  doc.setFontSize(7.5)
  doc.text('CUIT: 30-71709246-1', leftMargin, 25)
  doc.text('Calle Juan Manuel de Rosas S/N - Puerto Piray, Misiones - C.P. 3381', leftMargin, 29)

  // Logo desde archivo
  try {
    doc.addImage('/Imagen1.png', 'PNG', pageWidth - 45, 5, 40, 36)
  } catch (e) {
    console.warn('Logo no encontrado:', e)
  }

  // Línea divisoria bajo encabezado
  doc.setDrawColor(bordeColor[0], bordeColor[1], bordeColor[2])
  doc.setLineWidth(1)
  doc.line(leftMargin, 48, pageWidth - leftMargin, 48)

  // ===== CONTENIDO PRINCIPAL =====
  doc.setTextColor(0, 0, 0)

  // Título centrado
  doc.setFont('Arial', 'bold')
  doc.setFontSize(16)
  doc.text('CONSTANCIA DE ALUMNO REGULAR', pageWidth / 2, 62, { align: 'center' })

  // Datos
  const currentDate = new Date()
  const day = currentDate.getDate()
  const months = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']
  const month = months[currentDate.getMonth()]
  const year = currentDate.getFullYear()

  const fullNameUpper = `${student.first_name} ${student.last_name}`.toUpperCase()
  const pageWidthWithoutMargins = pageWidth - (leftMargin * 2)

  // Primer párrafo con sangría de primera línea
  doc.setFont('Arial', 'normal')
  doc.setFontSize(11)
  const bodyText = `La Dirección del INSTITUTO SUPERIOR DE INFORMÁTICA COD. 1206 de Puerto Piray, Misiones, Departamento Montecarlo, Hace constar que`
  
  // Dividir el texto manualmente para aplicar sangría a la primera línea
  const splitBody = doc.splitTextToSize(bodyText, pageWidthWithoutMargins - firstLineIndent)
  
  // Primera línea con sangría
  doc.text(splitBody[0], leftMargin + firstLineIndent, 75)
  
  // Resto de líneas sin sangría
  let currentY = 75
  for (let i = 0; i < splitBody.length; i++) {
    if (i === 0) continue // Ya se escribió
    doc.text(splitBody[i], leftMargin, currentY + 5 * (i))
  }
  currentY = 75 + (splitBody.length * 5)

  // Nombre y DNI en la misma línea
  doc.setFont('Arial', 'bold')
  doc.setFontSize(12)
  doc.text(fullNameUpper, leftMargin + firstLineIndent, currentY + 5)
  
  doc.setFont('Arial', 'normal')
  doc.setFontSize(10)
  doc.text('DNI Nº', leftMargin + firstLineIndent, currentY + 12)
  
  doc.setFont('Arial', 'bold')
  doc.setFontSize(11)
  doc.text(student.dni, leftMargin + firstLineIndent + 12, currentY + 12)

  // Segundo párrafo con sangría de primera línea
  doc.setFont('Arial', 'normal')
  doc.setFontSize(11)
  const bodyText2 = `es alumno/a regular en este establecimiento.

A pedido del interesado se extiende la presente constancia en Puerto Piray a los ${day} del mes de ${month} del ${year}, para ser presentada ante las autoridades que la requieran.`

  // Separar por párrafos
  const paragraphs = bodyText2.split('\n\n')
  let paraY = currentY + 20

  for (const para of paragraphs) {
    if (para.trim() === '') continue
    
    const splitPara = doc.splitTextToSize(para.trim(), pageWidthWithoutMargins - firstLineIndent)
    
    // Primera línea con sangría
    doc.text(splitPara[0], leftMargin + firstLineIndent, paraY)
    
    // Resto sin sangría
    for (let i = 1; i < splitPara.length; i++) {
      doc.text(splitPara[i], leftMargin, paraY + 5 * i)
    }
    
    paraY += (splitPara.length * 5) + 5 // Espacio entre párrafos
  }

  // ===== PIE DE FIRMA =====
  const footerY = pageHeight - 30

  // Líneas para firma
  doc.setDrawColor(0, 0, 0)
  doc.setLineWidth(0.5)
  doc.line(leftMargin, footerY, leftMargin + 30, footerY)
  doc.line(pageWidth - leftMargin - 30, footerY, pageWidth - leftMargin, footerY)

  // Textos de firma
  doc.setFont('Arial', 'normal')
  doc.setFontSize(9)
  doc.text('Firma del Alumno/a', leftMargin + 15, footerY + 5, { align: 'center' })
  doc.text('Secretaría Académica', pageWidth - leftMargin - 15, footerY + 5, { align: 'center' })

  // Sello o marca
  doc.setFontSize(8)
  doc.setTextColor(150, 150, 150)
  doc.text('Documento generado digitalmente', pageWidth / 2, pageHeight - 5, { align: 'center' })

  doc.save(`Constancia_Regular_${student.last_name}_${student.first_name}.pdf`)
}
