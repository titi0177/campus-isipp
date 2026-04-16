import ExcelJS from 'exceljs'
import { saveAs } from 'file-saver'
import type { ExamRecordStudentRow } from './generateExamRecordPdf'

interface GenerateExamExcelParams {
  subjectName: string
  subjectYear: number
  students: ExamRecordStudentRow[]
  examDate: string
  presidentName: string
  vocal1Name: string
  vocal2Name: string
}

/**
 * Genera acta de examen en XLSX preservando 100% del formato original
 */
export async function generateExamRecordExcel(params: GenerateExamExcelParams) {
  try {
    // Cargar plantilla XLSX
    const templatePath = '/Acta de Examenes ISIPP 2026 MATEMATICA.xlsx'
    const response = await fetch(templatePath)

    if (!response.ok) {
      throw new Error(`No se pudo cargar la plantilla: ${response.statusText}`)
    }

    const buffer = await response.arrayBuffer()

    // Crear workbook desde buffer
    const workbook = new ExcelJS.Workbook()
    await workbook.xlsx.load(buffer)

    // Obtener primera hoja
    const sheet = workbook.worksheets[0]

    if (!sheet) {
      throw new Error('No se encontró hoja de trabajo')
    }

    // Cargar datos en celdas específicas
    sheet.getCell('D7').value = params.subjectName
    sheet.getCell('J7').value = params.subjectYear
    sheet.getCell('D49').value = params.examDate

    // Profesores
    sheet.getCell('B42').value = params.presidentName
    sheet.getCell('F42').value = params.vocal1Name
    sheet.getCell('I42').value = params.vocal2Name

    // Alumnos
    params.students.forEach((student, i) => {
      const row = 11 + i
      sheet.getCell(`D${row}`).value = student.dni || ''
      sheet.getCell(`E${row}`).value = student.nombre || ''
    })

    // Escribir archivo
    const fileBuffer = await workbook.xlsx.writeBuffer()

    // Descargar
    const blob = new Blob([fileBuffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    })

    saveAs(blob, `Acta_Examen_${params.subjectName.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.xlsx`)

  } catch (error) {
    console.error('Error generating Excel:', error)
    throw error
  }
}
