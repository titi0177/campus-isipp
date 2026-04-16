import JSZip from 'jszip'
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
    
    const arrayBuffer = await response.arrayBuffer()
    
    // Descomprimir XLSX
    const zip = new JSZip()
    const xlsxZip = await zip.loadAsync(arrayBuffer)
    
    // Leer el archivo XML de la hoja
    let sheetXml = await xlsxZip.file('xl/worksheets/sheet1.xml')?.async('string')
    
    if (!sheetXml) {
      throw new Error('No se pudo encontrar la hoja de trabajo')
    }
    
    // Función para buscar y reemplazar celda en el XML como string
    const updateCellInXml = (xml: string, cellRef: string, value: string): string => {
      const stringValue = String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      
      // Regex para encontrar celda existente
      const cellRegex = new RegExp(`<c[^>]*r="${cellRef}"[^>]*>.*?</c>`, 's')
      
      if (cellRegex.test(xml)) {
        // Reemplazar celda existente manteniendo atributos
        const match = xml.match(new RegExp(`<c([^>]*)r="${cellRef}"([^>]*)>.*?</c>`, 's'))
        if (match) {
          const attrs = match[1] + 'r="' + cellRef + '"' + match[2]
          const newCell = `<c${attrs} t="str"><v>${stringValue}</v></c>`
          return xml.replace(cellRegex, newCell)
        }
      }
      
      return xml
    }
    
    // Aplicar todos los cambios
    sheetXml = updateCellInXml(sheetXml, 'D7', params.subjectName)
    sheetXml = updateCellInXml(sheetXml, 'J7', String(params.subjectYear))
    sheetXml = updateCellInXml(sheetXml, 'D49', params.examDate)
    sheetXml = updateCellInXml(sheetXml, 'B42', params.presidentName)
    sheetXml = updateCellInXml(sheetXml, 'F42', params.vocal1Name)
    sheetXml = updateCellInXml(sheetXml, 'I42', params.vocal2Name)
    
    // Alumnos
    const maxRows = 27
    for (let i = 0; i < maxRows; i++) {
      const row = 11 + i
      const student = params.students[i]
      
      if (student?.dni) {
        sheetXml = updateCellInXml(sheetXml, `D${row}`, student.dni)
      }
      if (student?.nombre) {
        sheetXml = updateCellInXml(sheetXml, `E${row}`, student.nombre)
      }
    }
    
    // Actualizar ZIP
    xlsxZip.file('xl/worksheets/sheet1.xml', sheetXml)
    
    // Generar archivo final
    const blob = await xlsxZip.generateAsync({ type: 'blob' })
    
    // Descargar
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
