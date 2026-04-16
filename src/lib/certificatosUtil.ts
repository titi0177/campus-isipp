/**
 * Utilidades para generar certificados y analíticos en PDF
 * Basado en modelos oficiales del Instituto Superior de Informática
 */

import jsPDF from 'jspdf'
import jsPDFAutoTable from 'jspdf-autotable'

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
  codigo: string
  materia: string
  parcial: number | null
  final: number | null
  estado: string
  año: number
  mes?: string
}

/**
 * Genera un analítico de calificaciones en PDF con diseño oficial
 */
export function generateAnalytico(student: StudentData, grades: GradeData[]) {
  const doc = new jsPDF('p', 'mm', 'a4')
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  let yPos = 15

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

      // Tabla de notas del año
      const tableData = yearGrades.map((g) => [
        g.codigo,
        g.materia,
        g.parcial !== null ? g.parcial.toString() : '—',
        g.final !== null ? g.final.toString() : '—',
        g.estado || 'REGULAR',
        g.mes || '—',
        year,
      ])

      ;(doc as any).autoTable({
        head: [['ASIGNATURA', 'CALIFICACION', 'CONDICION', 'MES', 'AÑO']],
        body: tableData.map((row) => [
          row[1], // materia
          row[3] !== '—' ? row[3] : row[2], // calificación (final si existe, sino parcial)
          row[4], // condición
          row[5], // mes
          row[6], // año
        ]),
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
          1: { halign: 'center' },
          2: { halign: 'center' },
          3: { halign: 'center' },
          4: { halign: 'center' },
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

  // Línea de firma
  yPos += 20
  doc.setLineWidth(0.5)
  doc.line(60, yPos, 120, yPos)

  yPos += 3
  doc.setFont(undefined, 'bold')
  doc.setFontSize(8)
  doc.text('Dirección', 90, yPos, { align: 'center' })

  // Descargar
  doc.save(`Analítico_${student.apellido}_${student.nombre}.pdf`)
}

/**
 * Genera una constancia de alumno regular en PDF con diseño oficial
 */
export function generateConstancia(student: StudentData) {
  const doc = new jsPDF('p', 'mm', 'a4')
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  let yPos = 20

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

  // Línea de firma
  yPos += 25
  doc.setLineWidth(0.5)
  doc.line(60, yPos, 120, yPos)

  yPos += 3
  doc.setFont(undefined, 'bold')
  doc.setFontSize(9)
  doc.text('Dirección', 90, yPos, { align: 'center' })

  // Descargar
  doc.save(`Constancia_${student.apellido}_${student.nombre}.pdf`)
}

/**
 * Obtiene el nombre del mes en español
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
