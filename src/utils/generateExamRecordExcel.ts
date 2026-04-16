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
    
    // Leer workbook.xml para encontrar el nombre de la hoja
    const workbookXml = await xlsxZip.file('xl/workbook.xml')?.async('string')
    if (!workbookXml) {
      throw new Error('No se pudo encontrar workbook.xml')
    }
    
    // Extraer el nombre del archivo de la hoja desde workbook.xml
    const sheetMatch = workbookXml.match(/r:id="rId1"/)
    const relsXml = await xlsxZip.file('xl/_rels/workbook.xml.rels')?.async('string')
    if (!relsXml) {
      throw new Error('No se pudo encontrar rels')
    }
    
    // Obtener la ruta del archivo de la hoja activa
    const sheetPathMatch = relsXml.match(/Id="rId1"[^>]*Target="([^"]+)"/)
    let sheetPath = sheetPathMatch ? sheetPathMatch[1] : 'worksheets/sheet1.xml'
    sheetPath = `xl/${sheetPath}`
    
    // Leer el archivo XML de la hoja
    let sheetXml = await xlsxZip.file(sheetPath)?.async('string')
    
    if (!sheetXml) {
      throw new Error(`No se pudo encontrar la hoja de trabajo en ${sheetPath}`)
    }
    
    // Usar DOMParser para manipular XML de forma segura
    const parser = new DOMParser()
    const xmlDoc = parser.parseFromString(sheetXml, 'text/xml')
    
    // Función para encontrar celda por referencia
    const findCell = (cellRef: string) => {
      // Buscar todos los elementos <c> y comprobar el atributo r
      const cells = xmlDoc.querySelectorAll('c')
      for (let cell of cells) {
        if (cell.getAttribute('r') === cellRef) {
          return cell
        }
      }
      return null
    }
    
    // Función para establecer valor de celda
    const setCellValue = (cellRef: string, value: string | number) => {
      const cell = findCell(cellRef)
      
      if (cell) {
        // Limpiar contenido anterior
        while (cell.firstChild) {
          cell.removeChild(cell.firstChild)
        }
        
        // Crear elemento v con el valor
        const v = xmlDoc.createElement('v')
        v.textContent = String(value)
        cell.appendChild(v)
        
        // Asegurar tipo correcto
        cell.setAttribute('t', 's')
      }
    }
    
    // Cargar datos
    setCellValue('D7', params.subjectName)
    setCellValue('J7', String(params.subjectYear))
    setCellValue('D49', params.examDate)
    setCellValue('B42', params.presidentName)
    setCellValue('F42', params.vocal1Name)
    setCellValue('I42', params.vocal2Name)
    
    // Alumnos
    const maxRows = 27
    for (let i = 0; i < maxRows; i++) {
      const row = 11 + i
      const student = params.students[i]
      
      if (student?.dni) {
        setCellValue(`D${row}`, student.dni)
      }
      if (student?.nombre) {
        setCellValue(`E${row}`, student.nombre)
      }
    }
    
    // Serializar XML de forma segura
    const serializer = new XMLSerializer()
    const modifiedXml = serializer.serializeToString(xmlDoc)
    
    // Actualizar ZIP con la hoja correcta
    xlsxZip.file(sheetPath, modifiedXml)
    
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
