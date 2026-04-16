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
    
    // Parsear XML
    const parser = new DOMParser()
    const xmlDoc = parser.parseFromString(sheetXml, 'application/xml')
    
    // Función para encontrar y actualizar celda por dirección (D7, J7, etc)
    const updateCell = (cellAddress: string, value: string | number) => {
      // Buscar celda por referencia r="D7"
      let cell = xmlDoc.querySelector(`c[r="${cellAddress}"]`)
      
      if (!cell) {
        // Si no existe, crear la celda
        const sheetData = xmlDoc.querySelector('sheetData')
        if (sheetData) {
          cell = xmlDoc.createElement('c')
          cell.setAttribute('r', cellAddress)
          cell.setAttribute('t', 'inlineStr')
          sheetData.appendChild(cell)
        }
      }
      
      if (cell) {
        // Limpiar contenido anterior
        const oldValue = cell.querySelector('v')
        if (oldValue) {
          oldValue.remove()
        }
        const oldIs = cell.querySelector('is')
        if (oldIs) {
          oldIs.remove()
        }
        
        // Crear nuevo valor con estructura XML correcta
        const valueElem = xmlDoc.createElement('is')
        const rElem = xmlDoc.createElement('r')
        const textElem = xmlDoc.createElement('t')
        textElem.textContent = String(value)
        
        rElem.appendChild(textElem)
        valueElem.appendChild(rElem)
        cell.appendChild(valueElem)
        cell.setAttribute('t', 'inlineStr')
      }
    }
    
    // Cargar todos los datos
    updateCell('D7', params.subjectName)
    updateCell('J7', String(params.subjectYear))
    updateCell('D49', params.examDate)
    updateCell('B42', params.presidentName)
    updateCell('F42', params.vocal1Name)
    updateCell('I42', params.vocal2Name)
    
    // Alumnos (D11-D37 DNI, E11-E37 Nombres)
    const maxRows = 27
    for (let i = 0; i < maxRows; i++) {
      const row = 11 + i
      const student = params.students[i]
      
      updateCell(`D${row}`, student?.dni || '')
      updateCell(`E${row}`, student?.nombre || '')
    }
    
    // Serializar XML modificado
    const serializer = new XMLSerializer()
    const modifiedSheetXml = serializer.serializeToString(xmlDoc)
    
    // Actualizar ZIP con XML modificado
    xlsxZip.file('xl/worksheets/sheet1.xml', modifiedSheetXml)
    
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
