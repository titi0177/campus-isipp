import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"

export function generateApprovedSubjects(student: any, subjects: any[]) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  })

  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  let yPos = 12

  // ============ LOGO ============
  try {
    const logoWidth = 35
    const logoHeight = 35
    const marginRight = 15

    doc.addImage(
      '/logo.png',
      'PNG',
      pageWidth - logoWidth - marginRight,
      yPos - 10,
      logoWidth,
      logoHeight
    )
  } catch (err) {
    console.error('Error adding logo:', err)
  }

  // ============ ENCABEZADO ============
  doc.setFontSize(10)
  doc.setFont(undefined, 'bold')
  doc.text('INSTITUTO SUPERIOR DE INFORMATICA (1206)', 20, yPos)

  yPos += 5
  doc.setFontSize(9)
  doc.setFont(undefined, 'normal')
  doc.text('FUNDACION NUESTRA SEÑORA DE LOS MILAGROS', 20, yPos)

  yPos += 4
  doc.text('(Personalía Jurídica A-4954)', 20, yPos)

  yPos += 4
  doc.text('CUIT: 30-71709246-1', 20, yPos)

  yPos += 4
  doc.text('Calle Juan Manuel de Rosas S/N – Puerto Piray, Misiones  C.P 3381', 20, yPos)

  // Línea separadora
  yPos += 6
  doc.setLineWidth(0.5)
  doc.line(20, yPos, pageWidth - 20, yPos)

  yPos += 12

  // ============ CUERPO NARRATIVO CON RESOLUCIÓN DINÁMICA ============
  doc.setFontSize(10)
  doc.setFont(undefined, 'normal')

  const fullName = `${student.last_name.toUpperCase()} ${student.first_name.toUpperCase()}`
  const carrera = student.program?.name || student.carrera || 'CARRERA'
  const resolucion = getResolucionByCarrera(carrera)

  const textoCuerpo = `El Instituto Superior de Informática Cod.1206 de Puerto Piray-Misiones, hace constar que ${fullName} DNI ${student.dni} aprobó las asignaturas que a continuación se detallan y que corresponde al plan de Estudios de la Carrera de ${carrera}; ${resolucion}`

  doc.text(textoCuerpo, 20, yPos, { maxWidth: pageWidth - 40 })

  yPos += 25

  // ============ TABLA DE CALIFICACIONES ============
  const tableData = subjects.map((s) => {
    const fechaObj = s.created_at ? new Date(s.created_at) : new Date()
    const mes = getMonthName(fechaObj.getMonth())
    const año = fechaObj.getFullYear()
    const calificacionFormato = formatNoteWithNumeral(s.final_grade)
    const condicion = s.final_status === 'promocionado' ? 'PROMOCIONADO' : 'REGULAR'

    return [s.name, calificacionFormato, condicion, mes, año.toString()]
  })

  autoTable(doc, {
    head: [['ASIGNATURA', 'CALIFICACION', 'CONDICION', 'MES', 'AÑO']],
    body: tableData,
    startY: yPos,
    margin: { left: 20, right: 20 },
    headStyles: {
      fillColor: [88, 44, 49],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9,
      halign: 'center',
    },
    bodyStyles: {
      fontSize: 8,
      halign: 'left',
    },
    alternateRowStyles: {
      fillColor: [240, 240, 240],
    },
    columnStyles: {
      1: { halign: 'center' },
      2: { halign: 'center' },
      3: { halign: 'center' },
      4: { halign: 'center' },
    },
  })

  yPos = (doc as any).lastAutoTable.finalY + 8

  // ============ PIE DE PÁGINA CON FECHA COMPLETA ============
  doc.setFont(undefined, 'normal')
  doc.setFontSize(9)

  const today = new Date()
  const day = today.getDate()
  const month = getMonthName(today.getMonth())
  const year = today.getFullYear()

  doc.text(
    `Se extiende la presente, a pedido del interesado, en Puerto Piray a los ${day} de ${month} de ${year} y para ser presentada ante las autoridades que la requieran.`,
    20,
    yPos,
    { maxWidth: pageWidth - 40 }
  )

  // ============ FIRMA ============
  const margenFirma = 60
  const firmaY = pageHeight - margenFirma

  doc.setLineWidth(0.3)
  doc.line(pageWidth / 2 - 35, firmaY, pageWidth / 2 + 35, firmaY)

  doc.setFontSize(10)
  doc.text('Secretario Académico', pageWidth / 2, firmaY + 6, { align: 'center' })

  doc.setFontSize(9)
  doc.text('Instituto Superior de Informática (1206)', pageWidth / 2, firmaY + 11, { align: 'center' })

  // Descargar
  doc.save(`Certificado_Aprobadas_${student.last_name}_${student.first_name}.pdf`)
}

/**
 * Convierte una nota numérica a su representación con numeral
 */
function formatNoteWithNumeral(nota: number | null): string {
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

/**
 * Obtiene el nombre del mes
 */
function getMonthName(month: number): string {
  const months = [
    'ENERO',
    'FEBRERO',
    'MARZO',
    'ABRIL',
    'MAYO',
    'JUNIO',
    'JULIO',
    'AGOSTO',
    'SEPTIEMBRE',
    'OCTUBRE',
    'NOVIEMBRE',
    'DICIEMBRE',
  ]
  return months[month]
}

/**
 * Obtiene la resolución correspondiente según la carrera
 */
function getResolucionByCarrera(carrera: string): string {
  const carreraUpper = carrera.toUpperCase()

  if (carreraUpper.includes('HIGIENE')) {
    return 'aprobado por la Resolución SPEPM 1899/20 Validez Nacional RM EXP Nº 0475/24.-'
  }

  // Default para ANALISTA DE SISTEMAS
  return 'aprobado por la Resolución SPEPM 48/2013 Validez Nacional RM EXP Nº 1919/17.-'
}
