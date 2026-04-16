import JSZip from "jszip"

export const generateExamRecordExcel = async (data: any) => {

  try {

    const response = await fetch("/Acta de Examenes ISIPP 2026 MATEMATICA.xlsx")
    const buffer = await response.arrayBuffer()

    const zip = await JSZip.loadAsync(buffer)

    const sheetPath = "xl/worksheets/sheet1.xml"
    const sharedStringsPath = "xl/sharedStrings.xml"

    const sheetXml = await zip.file(sheetPath)?.async("string")
    const sharedXml = await zip.file(sharedStringsPath)?.async("string")

    if (!sheetXml || !sharedXml) {
      throw new Error("No se pudo leer la plantilla Excel")
    }

    const parser = new DOMParser()

    const sheetDoc = parser.parseFromString(sheetXml, "application/xml")
    const sharedDoc = parser.parseFromString(sharedXml, "application/xml")

    const sharedRoot = sharedDoc.querySelector("sst")

    const addSharedString = (text: string) => {

      const si = sharedDoc.createElement("si")
      const t = sharedDoc.createElement("t")

      t.textContent = text

      si.appendChild(t)
      sharedRoot?.appendChild(si)

      return sharedRoot?.children.length! - 1

    }

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

      const index = addSharedString(value)

      const v = sheetDoc.createElement("v")
      v.textContent = String(index)

      cell.setAttribute("t", "s")

      cell.appendChild(v)

    }

    // ===== DATOS PRINCIPALES =====

    setCell("D7", data.subject)
    setCell("J7", data.year)
    setCell("D49", data.examDate)

    // ===== PROFESORES =====

    setCell("B42", data.president)
    setCell("F42", data.firstVocal)
    setCell("I42", data.secondVocal)

    // ===== ALUMNOS =====

    data.students.forEach((student: any, i: number) => {

      const row = 11 + i

      setCell(`D${row}`, student.dni)
      setCell(`E${row}`, student.name)

    })

    const serializer = new XMLSerializer()

    zip.file(sheetPath, serializer.serializeToString(sheetDoc))
    zip.file(sharedStringsPath, serializer.serializeToString(sharedDoc))

    const newFile = await zip.generateAsync({ type: "blob" })

    const url = URL.createObjectURL(newFile)

    const a = document.createElement("a")
    a.href = url
    a.download = "Acta_Examen.xlsx"
    a.click()

    URL.revokeObjectURL(url)

  } catch (err) {

    console.error("Error generating Excel:", err)

  }

}