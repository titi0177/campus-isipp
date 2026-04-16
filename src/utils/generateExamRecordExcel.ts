import JSZip from "jszip"

export const generateExamRecordExcel = async (data: any) => {

  try {

    const response = await fetch("/Acta de Examenes ISIPP 2026 MATEMATICA.xlsx")
    const buffer = await response.arrayBuffer()

    const zip = await JSZip.loadAsync(buffer)

    const sheetPath = "xl/worksheets/sheet1.xml"

    const sheetXml = await zip.file(sheetPath)?.async("string")

    if (!sheetXml) {
      throw new Error("No se pudo leer sheet1.xml")
    }

    const parser = new DOMParser()
    const sheetDoc = parser.parseFromString(sheetXml, "application/xml")

    const findCell = (ref: string) => {
      return sheetDoc.querySelector(`c[r="${ref}"]`)
    }

    const setCell = (ref: string, value: string) => {

      let cell = findCell(ref)

      const rowNumber = ref.match(/\d+/)?.[0]
      const row = sheetDoc.querySelector(`row[r="${rowNumber}"]`)

      if (!row) return

      if (!cell) {
        cell = sheetDoc.createElement("c")
        cell.setAttribute("r", ref)
        row.appendChild(cell)
      }

      while (cell.firstChild) {
        cell.removeChild(cell.firstChild)
      }

      cell.setAttribute("t", "inlineStr")

      const is = sheetDoc.createElement("is")
      const t = sheetDoc.createElement("t")

      t.textContent = value

      is.appendChild(t)
      cell.appendChild(is)

    }

    // ===== DATOS PRINCIPALES =====

    setCell("D7", data.subject || "")
    setCell("J7", data.year || "")
    setCell("D49", data.examDate || "")

    // ===== PROFESORES =====

    setCell("B42", data.president || "")
    setCell("F42", data.firstVocal || "")
    setCell("I42", data.secondVocal || "")

    // ===== ALUMNOS =====

    if (data.students) {

      data.students.forEach((student: any, i: number) => {

        const row = 11 + i

        setCell(`D${row}`, student.dni || "")
        setCell(`E${row}`, student.name || "")

      })

    }

    const serializer = new XMLSerializer()

    const updatedXml = serializer.serializeToString(sheetDoc)

    zip.file(sheetPath, updatedXml)

    const newFile = await zip.generateAsync({ type: "blob" })

    const url = URL.createObjectURL(newFile)

    const a = document.createElement("a")
    a.href = url
    a.download = "Acta_Examen.xlsx"

    document.body.appendChild(a)
    a.click()
    a.remove()

    URL.revokeObjectURL(url)

  } catch (err) {

    console.error("Error generating Excel:", err)

  }

}