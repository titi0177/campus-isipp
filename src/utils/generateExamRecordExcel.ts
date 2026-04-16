import JSZip from 'jszip'
import { read, write } from 'xlsx'
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
 * Genera acta de examen preservando 100% del formato original del XLS
 * Descarga el archivo original y lo modifica a nivel de datos sin tocar formatos
 */
export async function generateExamRecordExcel(params: GenerateExamExcelParams) {
  try {
    // Descargar archivo template original
    const templatePath = '/Acta de Examenes ISIPP 2026 MATEMATICA.xls'
    const response = await fetch(templatePath)
    
    if (!response.ok) {
      throw new Error(`No se pudo cargar la plantilla: ${response.statusText}`)
    }
    
    const arrayBuffer = await response.arrayBuffer()
    
    // Leer el archivo XLS manteniendo toda su estructura
    const workbook = read(new Uint8Array(arrayBuffer), {
      type: 'array',
      cellFormula: true,
      cellStyles: true,
      defval: ''
    })
    
    const sheetName = workbook.SheetNames[0]
    const ws = workbook.Sheets[sheetName]
    
    // Modificar SOLO los valores de las celdas, sin tocar nada más
    // Preservar todas las propiedades de la celda original
    const updateCell = (address: string, newValue: any) => {
      if (ws[address]) {
        // Mantener la celda existente, solo cambiar el valor
        ws[address].v = newValue
      } else {
        // Si la celda no existe, crearla con el mínimo
        ws[address] = { v: newValue, t: typeof newValue === 'number' ? 'n' : 's' }
      }
    }
    
    // Cargar datos
    updateCell('D7', params.subjectName)
    updateCell('J7', params.subjectYear)
    updateCell('D49', params.examDate)
    updateCell('B42', params.presidentName)
    updateCell('F42', params.vocal1Name)
    updateCell('I42', params.vocal2Name)
    
    // Alumnos
    const maxRows = 27
    for (let i = 0; i < maxRows; i++) {
      const row = 11 + i
      const student = params.students[i]
      
      updateCell(`D${row}`, student?.dni || '')
      updateCell(`E${row}`, student?.nombre || '')
    }
    
    // Escribir de vuelta preservando TODO el formato original
    const outputBuffer = write(workbook, {
      bookType: 'xls',
      type: 'array',
      cellFormula: true,
      cellStyles: true
    })
    
    // Descargar
    const blob = new Blob([outputBuffer], {
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
