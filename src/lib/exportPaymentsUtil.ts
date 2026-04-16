/**
 * Utilidad para exportar pagos a Excel de forma detallada
 * Sin dependencias externas - genera CSV que Excel puede abrir
 */

export function exportPaymentsToCSV(
  students: any[],
  programName: string,
  paymentConfig: any
) {
  try {
    let csvContent = 'data:text/csv;charset=utf-8,'

    // Encabezado del reporte
    csvContent += `REPORTE DETALLADO DE PAGOS\n`
    csvContent += `Carrera: ${programName}\n`
    csvContent += `Generado: ${new Date().toLocaleDateString('es-AR')} ${new Date().toLocaleTimeString('es-AR')}\n`
    csvContent += `\n`

    // Por cada estudiante, crear una sección
    students.forEach((student) => {
      csvContent += `\nESTUDIANTE: ${student.name} (${student.legajo})\n`
      csvContent += `Año: ${student.current_year}°\n`
      csvContent += `\n`

      // Encabezados de tabla
      csvContent += `Tipo,Período,Vencimiento,Estado,Fecha Pago,Método,Cuota Base,Incremento,Total a Pagar\n`

      let totalBase = 0
      let totalWithSurcharge = 0

      student.payments.forEach((payment: any) => {
        const tipoLabel =
          payment.payment_type === 'cuota_mensual'
            ? 'Cuota'
            : payment.payment_type === 'seguro'
              ? 'Seguro'
              : 'Inscripción'

        const periodo =
          payment.month
            ? `${[
                'Ene',
                'Feb',
                'Mar',
                'Abr',
                'May',
                'Jun',
                'Jul',
                'Ago',
                'Sep',
                'Oct',
                'Nov',
                'Dic',
              ][payment.month - 1]} ${payment.year}`
            : payment.year

        const vencimiento = new Date(payment.due_date).toLocaleDateString('es-AR')
        const estado = payment.status.charAt(0).toUpperCase() + payment.status.slice(1)
        const fechaPago = payment.paid_at
          ? new Date(payment.paid_at).toLocaleDateString('es-AR')
          : '-'

        const metodo = payment.payment_method || 'Efectivo'

        const baseAmount = payment.base_amount
        totalBase += baseAmount

        // Calcular si aplica incremento
        let surcharge = 0
        let totalAmount = baseAmount

        if (payment.status === 'pagado' && payment.paid_at) {
          const paidDate = new Date(payment.paid_at)
          const dueDate = new Date(payment.due_date)

          // Si se paga después del vencimiento
          if (paidDate > dueDate) {
            const year = dueDate.getFullYear()
            const month = dueDate.getMonth() + 1
            const day = 10

            // Calcular primer día hábil desde el 10
            let surchargeStartDate = new Date(year, month - 1, day)
            while (surchargeStartDate.getDay() === 0 || surchargeStartDate.getDay() === 6) {
              surchargeStartDate.setDate(surchargeStartDate.getDate() + 1)
            }

            // Pasar al siguiente día hábil
            surchargeStartDate.setDate(surchargeStartDate.getDate() + 1)

            if (paidDate >= surchargeStartDate) {
              surcharge = Math.round((baseAmount * payment.increment_percentage) / 100 * 100) / 100
              totalAmount = baseAmount + surcharge
            }
          }
        }

        totalWithSurcharge += totalAmount

        csvContent += `"${tipoLabel}","${periodo}","${vencimiento}","${estado}","${fechaPago}","${metodo}","$${baseAmount.toFixed(2)}","$${surcharge.toFixed(2)}","$${totalAmount.toFixed(2)}"\n`
      })

      csvContent += `\nTOTAL ALUMNO,"","","","","","$${totalBase.toFixed(2)}","","$${totalWithSurcharge.toFixed(2)}"\n`
    })

    // Resumen final
    csvContent += `\n\nRESUMEN GENERAL\n`
    csvContent += `Total Estudiantes,${students.length}\n`

    let grandTotalBase = 0
    let grandTotalWithSurcharge = 0

    students.forEach((student) => {
      student.payments.forEach((payment: any) => {
        const baseAmount = payment.base_amount
        grandTotalBase += baseAmount

        let totalAmount = baseAmount
        if (payment.status === 'pagado' && payment.paid_at) {
          const paidDate = new Date(payment.paid_at)
          const dueDate = new Date(payment.due_date)

          if (paidDate > dueDate) {
            const year = dueDate.getFullYear()
            const month = dueDate.getMonth() + 1
            let surchargeStartDate = new Date(year, month - 1, 10)

            while (surchargeStartDate.getDay() === 0 || surchargeStartDate.getDay() === 6) {
              surchargeStartDate.setDate(surchargeStartDate.getDate() + 1)
            }

            surchargeStartDate.setDate(surchargeStartDate.getDate() + 1)

            if (paidDate >= surchargeStartDate) {
              const surcharge = Math.round((baseAmount * payment.increment_percentage) / 100 * 100) / 100
              totalAmount = baseAmount + surcharge
            }
          }
        }

        grandTotalWithSurcharge += totalAmount
      })
    })

    csvContent += `Cuota Base Total,"$${grandTotalBase.toFixed(2)}"\n`
    csvContent += `Total con Incrementos,"$${grandTotalWithSurcharge.toFixed(2)}"\n`

    // Crear link y descargar
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute(
      'download',
      `pagos_${programName}_${new Date().toISOString().split('T')[0]}.csv`
    )
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    return true
  } catch (err) {
    console.error('Error exporting payments:', err)
    throw err
  }
}

export function exportStudentPaymentsToCSV(
  student: any,
  programName: string,
  paymentConfig: any
) {
  try {
    let csvContent = 'data:text/csv;charset=utf-8,'

    // Encabezado
    csvContent += `COMPROBANTE DE PAGOS\n`
    csvContent += `${programName}\n`
    csvContent += `\n`
    csvContent += `Alumno: ${student.name}\n`
    csvContent += `Legajo: ${student.legajo}\n`
    csvContent += `Año: ${student.current_year}°\n`
    csvContent += `Generado: ${new Date().toLocaleDateString('es-AR')} ${new Date().toLocaleTimeString('es-AR')}\n`
    csvContent += `\n`

    // Encabezados de tabla
    csvContent += `Tipo,Período,Vencimiento,Estado,Fecha Pago,Método,Cuota Base,Incremento,Total a Pagar\n`

    let totalBase = 0
    let totalWithSurcharge = 0

    student.payments.forEach((payment: any) => {
      const tipoLabel =
        payment.payment_type === 'cuota_mensual'
          ? 'Cuota'
          : payment.payment_type === 'seguro'
            ? 'Seguro'
            : 'Inscripción'

      const periodo =
        payment.month
          ? `${[
              'Ene',
              'Feb',
              'Mar',
              'Abr',
              'May',
              'Jun',
              'Jul',
              'Ago',
              'Sep',
              'Oct',
              'Nov',
              'Dic',
            ][payment.month - 1]} ${payment.year}`
          : payment.year

      const vencimiento = new Date(payment.due_date).toLocaleDateString('es-AR')
      const estado = payment.status.charAt(0).toUpperCase() + payment.status.slice(1)
      const fechaPago = payment.paid_at
        ? new Date(payment.paid_at).toLocaleDateString('es-AR')
        : '-'
      const metodo = payment.payment_method || 'Efectivo'

      const baseAmount = payment.base_amount
      totalBase += baseAmount

      let surcharge = 0
      let totalAmount = baseAmount

      if (payment.status === 'pagado' && payment.paid_at) {
        const paidDate = new Date(payment.paid_at)
        const dueDate = new Date(payment.due_date)

        if (paidDate > dueDate) {
          const year = dueDate.getFullYear()
          const month = dueDate.getMonth() + 1
          let surchargeStartDate = new Date(year, month - 1, 10)

          while (surchargeStartDate.getDay() === 0 || surchargeStartDate.getDay() === 6) {
            surchargeStartDate.setDate(surchargeStartDate.getDate() + 1)
          }

          surchargeStartDate.setDate(surchargeStartDate.getDate() + 1)

          if (paidDate >= surchargeStartDate) {
            surcharge = Math.round((baseAmount * payment.increment_percentage) / 100 * 100) / 100
            totalAmount = baseAmount + surcharge
          }
        }
      }

      totalWithSurcharge += totalAmount

      csvContent += `"${tipoLabel}","${periodo}","${vencimiento}","${estado}","${fechaPago}","${metodo}","$${baseAmount.toFixed(2)}","$${surcharge.toFixed(2)}","$${totalAmount.toFixed(2)}"\n`
    })

    csvContent += `\nTOTAL,"","","","","","$${totalBase.toFixed(2)}","","$${totalWithSurcharge.toFixed(2)}"\n`

    // Crear link y descargar
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute(
      'download',
      `pagos_${student.name}_${new Date().toISOString().split('T')[0]}.csv`
    )
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    return true
  } catch (err) {
    console.error('Error exporting student payments:', err)
    throw err
  }
}
