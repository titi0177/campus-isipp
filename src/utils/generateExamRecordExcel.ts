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
    
    // Parsear como XML para manipulación correcta
    const parser = new DOMParser()
    const xmlDoc = parser.parseFromString(sheetXml, 'application/xml')
    
    // Namespace para XLSX
    const ns = 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'
    
    // Función para actualizar celda existente o crearla
    const updateCell = (cellRef: string, value: string | number) => {
      const stringValue = String(value)
      
      // Buscar celda existente
      let cell = xmlDoc.querySelector(`c[r="${cellRef}"]`)
      
      if (cell) {
        // Celda existe - limpiar y actualizar
        while (cell.firstChild) {
          cell.removeChild(cell.firstChild)
        }
        
        // Agregar valor como texto simple
        const v = xmlDoc.createElement('v')
        v.textContent = stringValue
        cell.setAttribute('t', 's') // String type
        cell.appendChild(v)
      } else {
        // Celda no existe - crearla
        cell = xmlDoc.createElement('c')
        cell.setAttribute('r', cellRef)
        cell.setAttribute('t', 's') // String type
        
        const v = xmlDoc.createElement('v')
        v.textContent = stringValue
        cell.appendChild(v)
        
        // Insertar en sheetData
        const sheetData = xmlDoc.querySelector('sheetData')
        if (sheetData) {
          sheetData.appendChild(cell)
        }
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
      
      if (student?.dni) {
        updateCell(`D${row}`, student.dni)
      }
      if (student?.nombre) {
        updateCell(`E${row}`, student.nombre)
      }
    }
    
    // Serializar XML
    const serializer = new XMLSerializer()
    const modifiedXml = serializer.serializeToString(xmlDoc.documentElement)
    
    // Actualizar ZIP
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
