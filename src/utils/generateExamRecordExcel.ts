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
    
    // Descomprimir XLSX (que es un ZIP)
    const zip = new JSZip()
    const xlsxZip = await zip.loadAsync(arrayBuffer)
    
    // Leer el archivo XML de la hoja
    const sheetXml = await xlsxZip.file('xl/worksheets/sheet1.xml')?.async('string')
    
    if (!sheetXml) {
      throw new Error('No se pudo encontrar la hoja de trabajo')
    }
    
    // Parsear y modificar XML como texto (más confiable que DOM)
    let modifiedXml = sheetXml
    
    // Función para reemplazar o crear celda en el XML
    const setCellValue = (xml: string, cellRef: string, value: string | number): string => {
      const stringValue = String(value)
      
      // Buscar la celda existente
      const cellPattern = new RegExp(`<c r="${cellRef}"[^>]*>.*?</c>`, 's')
      
      if (cellPattern.test(xml)) {
        // Reemplazar celda existente
        const newCell = `<c r="${cellRef}" t="inlineStr"><is><r><t>${escapeXml(stringValue)}</t></r></is></c>`
        return xml.replace(cellPattern, newCell)
      } else {
        // Celda no existe, necesitamos insertarla en el <sheetData>
        // Encontrar la última </c> en sheetData y insertar después
        const sheetDataMatch = xml.match(/<sheetData>([\s\S]*?)<\/sheetData>/)
        if (sheetDataMatch) {
          const sheetDataContent = sheetDataMatch[1]
          // Insertar la nueva celda antes de </sheetData>
          const newCell = `<c r="${cellRef}" t="inlineStr"><is><r><t>${escapeXml(stringValue)}</t></r></is></c>`
          const updatedSheetData = sheetDataContent + newCell
          return xml.replace(/<sheetData>([\s\S]*?)<\/sheetData>/, `<sheetData>${updatedSheetData}</sheetData>`)
        }
      }
      return xml
    }
    
    // Helper para escapar caracteres XML
    const escapeXml = (str: string): string => {
      return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;')
    }
    
    // Cargar todos los datos
    modifiedXml = setCellValue(modifiedXml, 'D7', params.subjectName)
    modifiedXml = setCellValue(modifiedXml, 'J7', String(params.subjectYear))
    modifiedXml = setCellValue(modifiedXml, 'D49', params.examDate)
    modifiedXml = setCellValue(modifiedXml, 'B42', params.presidentName)
    modifiedXml = setCellValue(modifiedXml, 'F42', params.vocal1Name)
    modifiedXml = setCellValue(modifiedXml, 'I42', params.vocal2Name)
    
    // Alumnos (D11-D37 DNI, E11-E37 Nombres)
    const maxRows = 27
    for (let i = 0; i < maxRows; i++) {
      const row = 11 + i
      const student = params.students[i]
      
      modifiedXml = setCellValue(modifiedXml, `D${row}`, student?.dni || '')
      modifiedXml = setCellValue(modifiedXml, `E${row}`, student?.nombre || '')
    }
    
    // Actualizar ZIP con XML modificado
    xlsxZip.file('xl/worksheets/sheet1.xml', modifiedXml)
    
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
