import ExcelJS from "exceljs"
import { saveAs } from "file-saver"

export const generateExamRecordExcel = async (data: any) => {

  console.log("DATA ACTA:", data)

  try {

    const response = await fetch("/Acta de Examenes ISIPP 2026 MATEMATICA.xlsx")
    const buffer = await response.arrayBuffer()

    const workbook = new ExcelJS.Workbook()

    await workbook.xlsx.load(buffer)

    const sheet = workbook.worksheets[0]

    // ===== DATOS PRINCIPALES =====

    sheet.getCell("D7").value = data && data.subject ? data.subject : ""
    sheet.getCell("J7").value = data && data.year ? data.year : ""
    sheet.getCell("D49").value = data && data.examDate ? data.examDate : ""

    // ===== PROFESORES =====

    sheet.getCell("B42").value = data && data.president ? data.president : ""
    sheet.getCell("F42").value = data && data.firstVocal ? data.firstVocal : ""
    sheet.getCell("I42").value = data && data.secondVocal ? data.secondVocal : ""

    // ===== ALUMNOS =====

    const students = data && data.students ? data.students : []

    students.forEach((student: any, i: number) => {

      const row = 11 + i

      sheet.getCell("D" + row).value = student && student.dni ? student.dni : ""

      sheet.getCell("E" + row).value =
        student && (student.name || student.full_name || student.student_name)
          ? (student.name || student.full_name || student.student_name)
          : ""

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
