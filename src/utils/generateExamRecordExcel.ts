import { read, write, utils } from 'xlsx'
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
 * Genera acta de examen en Excel basada en plantilla
 */
export async function generateExamRecordExcel(params: GenerateExamExcelParams) {
  try {
    // Leer archivo template
    const templatePath = '/Acta de Examenes ISIPP 2026 MATEMATICA.xls'
    const response = await fetch(templatePath)
    const arrayBuffer = await response.arrayBuffer()
    
    // Parsear workbook
    const workbook = read(new Uint8Array(arrayBuffer), { type: 'array' })
    const worksheet = workbook.Sheets[workbook.SheetNames[0]]

    // Completar celdas fijas
    // D7: Materia
    worksheet['D7'] = { t: 's', v: params.subjectName }
    
    // J7: Año
    worksheet['J7'] = { t: 'n', v: params.subjectYear }
    
    // D49: Fecha
    worksheet['D49'] = { t: 's', v: params.examDate }
    
    // Presidente (celdas fusionadas B42:D42)
    worksheet['B42'] = { t: 's', v: params.presidentName }
    worksheet['C42'] = { t: 's', v: '' }
    worksheet['D42'] = { t: 's', v: '' }
    
    // Vocal 1 (celdas fusionadas F42:G42)
    worksheet['F42'] = { t: 's', v: params.vocal1Name }
    worksheet['G42'] = { t: 's', v: '' }
    
    // Vocal 2 (celdas fusionadas I42:L42)
    worksheet['I42'] = { t: 's', v: params.vocal2Name }
    worksheet['J42'] = { t: 's', v: '' }
    worksheet['K42'] = { t: 's', v: '' }
    worksheet['L42'] = { t: 's', v: '' }
    
    // Completar alumnos (D11-D37 DNI, E11-E37 Nombres)
    const maxRows = 27 // D11 a D37 son 27 filas
    for (let i = 0; i < maxRows; i++) {
      const row = 11 + i
      const student = params.students[i]
      
      if (student) {
        // DNI en columna D
        worksheet[`D${row}`] = { t: 's', v: student.dni || '' }
        // Nombre en columna E
        worksheet[`E${row}`] = { t: 's', v: student.nombre || '' }
      } else {
        // Limpiar filas vacías
        worksheet[`D${row}`] = { t: 's', v: '' }
        worksheet[`E${row}`] = { t: 's', v: '' }
      }
    }

    // Escribir workbook
    const excelBuffer = write(workbook, { bookType: 'xls', type: 'array' })
    
    // Descargar archivo
    const blob = new Blob([excelBuffer], { 
      type: 'application/vnd.ms-excel' 
    })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `Acta_Examen_${params.subjectName}_${new Date().toISOString().slice(0, 10)}.xls`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    
  } catch (error) {
    console.error('Error generating Excel:', error)
    throw error
  }
}
