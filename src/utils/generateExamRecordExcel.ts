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
 * Genera acta de examen en Excel preservando el formato de la plantilla
 */
export async function generateExamRecordExcel(params: GenerateExamExcelParams) {
  try {
    // Cargar plantilla XLS
    const templatePath = '/Acta de Examenes ISIPP 2026 MATEMATICA.xls'
    const response = await fetch(templatePath)
    
    if (!response.ok) {
      throw new Error(`No se pudo cargar la plantilla: ${response.statusText}`)
    }
    
    const arrayBuffer = await response.arrayBuffer()
    
    // Leer workbook con XLSX manteniendo formatos
    const workbook = read(arrayBuffer, { 
      type: 'array',
      cellFormula: false,
      cellStyles: false
    })
    
    // Obtener primera hoja
    const sheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[sheetName]
    
    if (!worksheet) {
      throw new Error('No se pudo acceder a la hoja de trabajo')
    }

    // Función para establecer valor sin perder formato
    const setCellValue = (cellAddress: string, value: any) => {
      if (!worksheet[cellAddress]) {
        worksheet[cellAddress] = {}
      }
      const cell = worksheet[cellAddress]
      
      // Preservar propiedades existentes (estilos, etc)
      cell.v = value
      
      // Detectar tipo
      if (typeof value === 'number') {
        cell.t = 'n'
      } else if (typeof value === 'boolean') {
        cell.t = 'b'
      } else {
        cell.t = 's'
      }
    }

    // Completar celdas específicas
    setCellValue('D7', params.subjectName)
    setCellValue('J7', params.subjectYear)
    setCellValue('D49', params.examDate)
    setCellValue('B42', params.presidentName)
    setCellValue('F42', params.vocal1Name)
    setCellValue('I42', params.vocal2Name)
    
    // Completar alumnos (D11-D37 DNI, E11-E37 Nombres)
    const maxRows = 27
    for (let i = 0; i < maxRows; i++) {
      const row = 11 + i
      const student = params.students[i]
      
      if (student) {
        setCellValue(`D${row}`, student.dni || '')
        setCellValue(`E${row}`, student.nombre || '')
      } else {
        setCellValue(`D${row}`, '')
        setCellValue(`E${row}`, '')
      }
    }

    // Escribir archivo preservando formatos
    const excelBuffer = write(workbook, { 
      bookType: 'xlsx',
      type: 'array'
    })
    
    // Descargar
    const blob = new Blob([excelBuffer], { 
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
