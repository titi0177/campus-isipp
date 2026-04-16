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
 * Genera acta de examen en Excel basada en plantilla, preservando formato
 */
export async function generateExamRecordExcel(params: GenerateExamExcelParams) {
  try {
    // Leer archivo template
    const templatePath = '/Acta de Examenes ISIPP 2026 MATEMATICA.xls'
    const response = await fetch(templatePath)
    const arrayBuffer = await response.arrayBuffer()
    
    // Parsear workbook preservando formato
    const workbook = read(new Uint8Array(arrayBuffer), { 
      type: 'array',
      cellFormula: true,
      cellStyles: true
    })
    const worksheet = workbook.Sheets[workbook.SheetNames[0]]

    // Función auxiliar para preservar formato de celda
    const setCellValue = (cellRef: string, value: string | number) => {
      if (!worksheet[cellRef]) {
        worksheet[cellRef] = {}
      }
      const cell = worksheet[cellRef]
      
      // Preservar estilos y formato existente
      if (typeof value === 'number') {
        cell.t = 'n'
        cell.v = value
      } else {
        cell.t = 's'
        cell.v = value
      }
    }

    // Completar celdas específicas SIN cambiar formato
    setCellValue('D7', params.subjectName)
    setCellValue('J7', params.subjectYear)
    setCellValue('D49', params.examDate)
    
    // Presidente (B42:D42 - celdas fusionadas)
    setCellValue('B42', params.presidentName)
    setCellValue('C42', '')
    setCellValue('D42', '')
    
    // Vocal 1 (F42:G42 - celdas fusionadas)
    setCellValue('F42', params.vocal1Name)
    setCellValue('G42', '')
    
    // Vocal 2 (I42:L42 - celdas fusionadas)
    setCellValue('I42', params.vocal2Name)
    setCellValue('J42', '')
    setCellValue('K42', '')
    setCellValue('L42', '')
    
    // Completar alumnos (D11-D37 DNI, E11-E37 Nombres)
    const maxRows = 27 // D11 a D37 son 27 filas
    for (let i = 0; i < maxRows; i++) {
      const row = 11 + i
      const student = params.students[i]
      
      if (student) {
        setCellValue(`D${row}`, student.dni || '')
        setCellValue(`E${row}`, student.nombre || '')
      } else {
        // Limpiar filas vacías pero preservar formato
        setCellValue(`D${row}`, '')
        setCellValue(`E${row}`, '')
      }
    }

    // Escribir workbook preservando formato original
    const excelBuffer = write(workbook, { 
      bookType: 'xls', 
      type: 'array',
      cellFormula: true,
      cellStyles: true
    })
    
    // Descargar archivo
    const blob = new Blob([excelBuffer], { 
      type: 'application/vnd.ms-excel' 
    })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `Acta_Examen_${params.subjectName.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.xls`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    
  } catch (error) {
    console.error('Error generating Excel:', error)
    throw error
  }
}
