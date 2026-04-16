import ExcelJS from "exceljs"
import { saveAs } from "file-saver"

export const generateExamRecordExcel = async (data: any) => {

  try {

    const response = await fetch("/Acta de Examenes ISIPP 2026 MATEMATICA.xlsx")
    const buffer = await response.arrayBuffer()

    const workbook = new ExcelJS.Workbook()

    await workbook.xlsx.load(buffer)

    const sheet = workbook.worksheets[0]

    // ===== DATOS PRINCIPALES =====

    sheet.getCell("D7").value = data.subject
    sheet.getCell("J7").value = data.year
    sheet.getCell("D49").value = data.examDate

    // ===== PROFESORES =====

    sheet.getCell("B42").value = data.president
    sheet.getCell("F42").value = data.firstVocal
    sheet.getCell("I42").value = data.secondVocal

    // ===== ALUMNOS =====

    data.students.forEach((student: any, i: number) => {

      const row = 11 + i

      sheet.getCell(`D${row}`).value = student.dni
      sheet.getCell(`E${row}`).value = student.name

    })

    const fileBuffer = await workbook.xlsx.writeBuffer()

    const blob = new Blob([fileBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    })

    saveAs(blob, "Acta_Examen.xlsx")

  } catch (err) {

    console.error("Error generating Excel:", err)

  }

}