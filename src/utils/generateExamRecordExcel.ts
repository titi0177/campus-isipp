import JSZip from "jszip"

export const generarActaExcel = async (data: any) => {

  try {

    // cargar plantilla
    const response = await fetch("/Acta de Examenes ISIPP 2026 MATEMATICA.xlsx")
    const buffer = await response.arrayBuffer()

    const zip = await JSZip.loadAsync(buffer)

    const sheetPath = "xl/worksheets/sheet1.xml"

    const sheetXml = await zip.file(sheetPath)?.async("string")

    if (!sheetXml) {
      throw new Error("No se pudo encontrar la hoja Excel")
    }

    const parser = new DOMParser()
    const xmlDoc = parser.parseFromString(sheetXml, "application/xml")

    // buscar celda
    const findCell = (cellRef: string) => {
      return xmlDoc.querySelector(`c[r="${cellRef}"]`)
    }

    // establecer valor de celda
    const setCellValue = (cellRef: string, value: string | number) => {

      let cell = findCell(cellRef)

      const rowNumber = cellRef.match(/\d+/)?.[0]

      const row = xmlDoc.querySelector(`row[r="${rowNumber}"]`)

      if (!row) return

      if (!cell) {
        cell = xmlDoc.createElement("c")
        cell.setAttribute("r", cellRef)
        row.appendChild(cell)
      }

      while (cell.firstChild) {
        cell.removeChild(cell.firstChild)
      }

      const v = xmlDoc.createElement("v")
      v.textContent = String(value)

      cell.appendChild(v)
    }

    // ===== DATOS PRINCIPALES =====

    setCellValue("D7", data.materia)
    setCellValue("J7", data.anio)
    setCellValue("D49", data.fecha)

    // ===== PRESIDENTE Y VOCALES =====

    setCellValue("B42", data.presidente)
    setCellValue("F42", data.vocal1)
    setCellValue("I42", data.vocal2)

    // ===== ALUMNOS =====

    data.alumnos.forEach((alumno: any, index: number) => {

      const fila = 11 + index

      setCellValue(`D${fila}`, alumno.dni)
      setCellValue(`E${fila}`, alumno.nombre)

    })

    // guardar XML modificado
    const serializer = new XMLSerializer()
    const newSheetXml = serializer.serializeToString(xmlDoc)

    zip.file(sheetPath, newSheetXml)

    // generar excel final
    const newFile = await zip.generateAsync({ type: "blob" })

    const url = window.URL.createObjectURL(newFile)

    const a = document.createElement("a")
    a.href = url
    a.download = "Acta_Examen.xlsx"

    a.click()

    window.URL.revokeObjectURL(url)

  } catch (error) {

    console.error("Error generating Excel:", error)

  }

}