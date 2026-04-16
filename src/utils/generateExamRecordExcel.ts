import { Workbook } from 'exceljs'
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
 * Genera acta de examen en Excel preservando 100% del formato de la plantilla
 */
export async function generateExamRecordExcel(params: GenerateExamExcelParams) {
  try {
    // Cargar plantilla
    const templatePath = '/Acta de Examenes ISIPP 2026 MATEMATICA.xls'
    const response = await fetch(templatePath)
    const arrayBuffer = await response.arrayBuffer()
    
    // Crear workbook desde buffer
    const workbook = new Workbook()
    await workbook.xlsx.load(arrayBuffer)
    
    // Obtener primera hoja
    const worksheet = workbook.worksheets[0]

    // Completar celdas específicas sin tocar nada más
    // D7: Materia
    worksheet.getCell('D7').value = params.subjectName
    
    // J7: Año
    worksheet.getCell('J7').value = params.subjectYear
    
    // D49: Fecha
    worksheet.getCell('D49').value = params.examDate
    
    // Presidente (B42:D42 - celdas fusionadas, solo poner en B42)
    worksheet.getCell('B42').value = params.presidentName
    
    // Vocal 1 (F42:G42 - celdas fusionadas, solo poner en F42)
    worksheet.getCell('F42').value = params.vocal1Name
    
    // Vocal 2 (I42:L42 - celdas fusionadas, solo poner en I42)
    worksheet.getCell('I42').value = params.vocal2Name
    
    // Completar alumnos (D11-D37 DNI, E11-E37 Nombres)
    const maxRows = 27 // D11 a D37 son 27 filas
    for (let i = 0; i < maxRows; i++) {
      const row = 11 + i
      const student = params.students[i]
      
      if (student) {
        // DNI en columna D
        worksheet.getCell(`D${row}`).value = student.dni || ''
        // Nombre en columna E
        worksheet.getCell(`E${row}`).value = student.nombre || ''
      } else {
        // Limpiar filas vacías
        worksheet.getCell(`D${row}`).value = ''
        worksheet.getCell(`E${row}`).value = ''
      }
    }

    // Generar buffer del archivo
    const buffer = await workbook.xlsx.writeBuffer()
    
    // Descargar archivo
    const blob = new Blob([buffer], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `Acta_Examen_${params.subjectName.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.xlsx`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    
  } catch (error) {
    console.error('Error generating Excel:', error)
    throw error
  }
}
