/**
 * Utilidades para generar certificados y analíticos en PDF
 * Basado en modelos oficiales del Instituto Superior de Informática
 */

import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

export interface StudentData {
  nombre: string
  apellido: string
  dni: string
  legajo: string
  carrera: string
  año: number
  email: string
}

export interface GradeData {
  id?: string
  codigo: string
  materia: string
  parcial: number | null
  final: number | null
  estado: string
  condicion: string
  año: number
  mes?: string
  updated_at?: string
  created_at?: string
  allows_promotion?: boolean
}

/**
 * Genera un analítico de calificaciones en PDF con diseño oficial
 */
export function generateAnalytico(student: StudentData, grades: GradeData[]) {
  const doc = new jsPDF('p', 'mm', 'a4')
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

  yPos += 20

  // ============ DATOS DEL ALUMNO ============
  doc.setFontSize(10)
  doc.setFont(undefined, 'normal')

  const fullName = `${student.apellido.toUpperCase()} ${student.nombre.toUpperCase()}`
  doc.text(
    `El Instituto Superior de Informática Cod.1206 de Puerto Piray-Misiones, hace constar que ${fullName} DNI ${student.dni} aprobó las asignaturas que a continuación se detallan y que corresponde al plan de Estudios de la Carrera de ${student.carrera}`,
    20,
    yPos,
    { maxWidth: pageWidth - 40 }
  )

  yPos += 25

  // ============ TABLA DE CALIFICACIONES ============
  // Agrupar por año
  const gradesByYear = grades.reduce(
    (acc, grade) => {
      const key = grade.año
      if (!acc[key]) acc[key] = []
      acc[key].push(grade)
      return acc
    },
    {} as Record<number, GradeData[]>
  )

  // Procesar cada año
  Object.keys(gradesByYear)
    .sort((a, b) => parseInt(a) - parseInt(b))
    .forEach((year) => {
      const yearGrades = gradesByYear[year]

      const tableData = yearGrades.map((g) => [
        g.codigo,
        g.materia,
        g.final !== null ? g.final.toString() : '—',
        getCondicion(g.final, g.allows_promotion),
        g.created_at ? formatDateForPdf(g.created_at) : '—',
        year,
      ])

      autoTable(doc, {
        head: [['CÓDIGO', 'MATERIA', 'NOTA', 'CONDICIÓN', 'FECHA', 'AÑO']],
        body: tableData,
        startY: yPos,
        margin: { left: 20, right: 20 },
        headStyles: {
          fillColor: [200, 200, 200],
          textColor: [0, 0, 0],
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
          0: { halign: 'center' },
          2: { halign: 'center' },
          3: { halign: 'center' },
          4: { halign: 'center' },
          5: { halign: 'center' },
        },
      })

      yPos = (doc as any).lastAutoTable.finalY + 5
    })

  // ============ PROMEDIO GENERAL ============
  const validGrades = grades.filter((g) => g.final !== null && g.final !== undefined)
  if (validGrades.length > 0) {
    const average = validGrades.reduce((sum, g) => sum + (g.final || 0), 0) / validGrades.length
    yPos += 5
    doc.setFont(undefined, 'bold')
    doc.setFontSize(9)
    doc.text(`PROMEDIO GENERAL: ${average.toFixed(2)}`, 20, yPos)
    yPos += 10
  }

  // ============ PIE DE PÁGINA ============
  doc.setFont(undefined, 'normal')
  doc.setFontSize(9)

  // Obtener fecha de carga de la nota final más reciente
  const latestGrade = grades
    .filter((g) => g.updated_at)
    .sort((a, b) => {
      const dateA = new Date(a.updated_at || 0).getTime()
      const dateB = new Date(b.updated_at || 0).getTime()
      return dateB - dateA
    })[0]

  let displayDate = new Date()
  if (latestGrade?.updated_at) {
    displayDate = new Date(latestGrade.updated_at)
  }

  const day = displayDate.getDate()
  const month = getMonthName(displayDate.getMonth())
  const year = displayDate.getFullYear()

  doc.text(
    `Se extiende la presente, a pedido del interesado, en Puerto Piray a los ${day} días del mes de ${month} del ${year} y para ser presentada ante las autoridades que la requieran.`,
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
  doc.save(`Analítico_${student.apellido}_${student.nombre}.pdf`)
}

/**
 * Genera un certificado de materias aprobadas (solo aprobadas) en PDF
 */
export function generateApprovedCertificate(student: StudentData, grades: GradeData[]) {
  const doc = new jsPDF('p', 'mm', 'a4')
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

  // ============ TÍTULO ============
  doc.setFontSize(12)
  doc.setFont(undefined, 'bold')
  doc.text('CERTIFICADO DE MATERIAS APROBADAS', pageWidth / 2, yPos, { align: 'center' })

  yPos += 10

  // ============ DATOS DEL ALUMNO ============
  doc.setFontSize(9)
  doc.setFont(undefined, 'normal')

  const fullName = `${student.apellido.toUpperCase()} ${student.nombre.toUpperCase()}`
  doc.text(`Alumno: ${fullName}`, 20, yPos)
  yPos += 4
  doc.text(`DNI: ${student.dni}`, 20, yPos)
  yPos += 4
  doc.text(`Legajo: ${student.legajo}`, 20, yPos)
  yPos += 4
  doc.text(`Carrera: ${student.carrera}`, 20, yPos)

  yPos += 10

  // ============ TABLA DE CALIFICACIONES ============
  // Agrupar por año
  const gradesByYear = grades.reduce(
    (acc, grade) => {
      const key = grade.año
      if (!acc[key]) acc[key] = []
      acc[key].push(grade)
      return acc
    },
    {} as Record<number, GradeData[]>
  )

  // Procesar cada año
  Object.keys(gradesByYear)
    .sort((a, b) => parseInt(a) - parseInt(b))
    .forEach((year) => {
      const yearGrades = gradesByYear[year]

      const tableData = yearGrades.map((g) => [
        g.codigo,
        g.materia,
        g.final !== null ? g.final.toString() : '—',
        getCondicion(g.final, g.allows_promotion),
        g.created_at ? formatDateForPdf(g.created_at) : '—',
      ])

      autoTable(doc, {
        head: [['CÓDIGO', 'MATERIA', 'NOTA', 'RESULTADO', 'FECHA APROBACIÓN']],
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
          0: { halign: 'center' },
          2: { halign: 'center' },
          3: { halign: 'center' },
          4: { halign: 'center' },
        },
      })

      yPos = (doc as any).lastAutoTable.finalY + 8
    })

  // ============ PIE DE PÁGINA ============
  doc.setFont(undefined, 'normal')
  doc.setFontSize(9)

  const today = new Date()
  const day = today.getDate()
  const month = getMonthName(today.getMonth())
  const year = today.getFullYear()

  doc.text(
    `Se extiende la presente, a pedido del interesado, en Puerto Piray a los ${day} días del mes de ${month} del ${year} y para ser presentada ante las autoridades que la requieran.`,
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
  doc.save(`Certificado_Aprobadas_${student.apellido}_${student.nombre}.pdf`)
}

/**
 * Genera una constancia de alumno regular en PDF con diseño oficial
 */
export function generateConstancia(student: StudentData) {
  const doc = new jsPDF('p', 'mm', 'a4')
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

  yPos += 20

  // ============ TÍTULO ============
  doc.setFontSize(14)
  doc.setFont(undefined, 'bold')
  doc.text('CONSTANCIA DE ALUMNO REGULAR', pageWidth / 2, yPos, { align: 'center' })

  yPos += 25

  // ============ CUERPO DEL DOCUMENTO ============
  doc.setFontSize(11)
  doc.setFont(undefined, 'normal')

  const fullName = `${student.apellido.toUpperCase()} ${student.nombre.toUpperCase()}`

  const text = `La Dirección Del INSTITUTO SUPERIOR DE INFORMATICA COD. 1206 de Puerto Piray, Misiones Departamento Montecarlo, Hace constar que ${fullName} DNI NRO ${student.dni} es alumno regular en este establecimiento.`

  doc.text(text, 20, yPos, { maxWidth: pageWidth - 40 })

  yPos += 30

  // ============ PIE DE PÁGINA ============
  doc.setFontSize(10)
  doc.setFont(undefined, 'normal')

  const today = new Date()
  const day = today.getDate()
  const month = getMonthName(today.getMonth())
  const year = today.getFullYear()

  const finalText = `A pedido del interesado se extiende la presente constancia en Puerto Piray a los ${day} días del mes de ${month} del ${year} y para ser presentada ante las autoridades que la requieran.`

  doc.text(finalText, 20, yPos, { maxWidth: pageWidth - 40 })

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
  doc.save(`Constancia_${student.apellido}_${student.nombre}.pdf`)
}

/**
 * Formatea una fecha para mostrar en PDF
 */
function formatDateForPdf(dateStr: string): string {
  const date = new Date(dateStr)
  const day = date.getDate()
  const month = getMonthName(date.getMonth())
  const year = date.getFullYear()
  return `${day}/${month.substring(0, 3)}/${year}`
}

/**
 * Obtiene la condición correcta basada en nota y allows_promotion
 */
export function getCondicion(nota: number | null, allows_promotion: boolean | undefined): string {
  if (nota === null || nota === undefined) return 'N/A'
  if (nota >= 8 && allows_promotion) return 'PROMOCIONAL'
  if (nota >= 6) return 'APROBADO'
  return 'DESAPROBADO'
}

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
