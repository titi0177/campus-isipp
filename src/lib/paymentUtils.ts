/**
 * Utility functions for payment calculations
 */

/**
 * Check if a date is a business day (Monday-Friday, excluding holidays)
 */
export function isBusinessDay(date: Date): boolean {
  const day = date.getDay()
  // 0 = Sunday, 6 = Saturday
  return day !== 0 && day !== 6
}

/**
 * Get the first business day starting from a given date
 * @param date - Start date
 */
export function getFirstBusinessDayFrom(date: Date): Date {
  const result = new Date(date)
  while (!isBusinessDay(result)) {
    result.setDate(result.getDate() + 1)
  }
  return result
}

/**
 * Get the 10th of the month's first business day (cutoff for surcharge)
 * @param year - Year
 * @param month - Month (1-12)
 */
export function getSurchargeStartDate(year: number, month: number): Date {
  // Start from the 10th of the month
  const tenthDay = new Date(year, month - 1, 10)
  // Get the first business day from the 10th onwards
  return getFirstBusinessDayFrom(tenthDay)
}

/**
 * Check if a payment date is after the surcharge cutoff (first business day from 10th)
 * @param paymentDate - Date payment was made
 */
export function isAfterSurchargeDate(paymentDate: Date): boolean {
  const year = paymentDate.getFullYear()
  const month = paymentDate.getMonth() + 1
  const surchargeStartDate = getSurchargeStartDate(year, month)

  // Payment after surcharge start date (next day onwards)
  return paymentDate > surchargeStartDate
}

/**
 * Calculate payment amount with surcharge if applicable
 * 
 * REGLAS:
 * - Del 1 al 10 del mes: Se cobra cuota base (sin incremento)
 * - Después del 10: Se cobra cuota base + 15% SOLO si la fecha de pago es > fecha de vencimiento
 * - Si se paga antes de la fecha de vencimiento: No se aplica el 15% aunque sea después del 10
 * 
 * @param baseAmount - Base payment amount
 * @param dueDate - Payment due date (fecha de vencimiento)
 * @param paidDate - Actual payment date (fecha en que se paga)
 * @param surchargePercent - Surcharge percentage (default 15)
 */
export function calculatePaymentWithSurcharge(
  baseAmount: number,
  dueDate: string,
  paidDate: string,
  surchargePercent: number = 15
): { baseAmount: number; surcharge: number; totalAmount: number; appliedSurcharge: boolean } {
  const paidDateObj = new Date(paidDate)
  const dueDateObj = new Date(dueDate)

  // REGLA 1: Si se paga ANTES del vencimiento, NO se aplica el 15%
  if (paidDateObj <= dueDateObj) {
    return {
      baseAmount,
      surcharge: 0,
      totalAmount: baseAmount,
      appliedSurcharge: false,
    }
  }

  // REGLA 2: Se paga DESPUÉS del vencimiento
  // Verificar si se paga después del primer día hábil a partir del 10 del mes de vencimiento
  const year = dueDateObj.getFullYear()
  const month = dueDateObj.getMonth() + 1
  const surchargeStartDate = getSurchargeStartDate(year, month)

  // El 15% se aplica solo si pagó después del primer día hábil a partir del 10
  const isAfterSurchargeCutoff = paidDateObj > surchargeStartDate

  const surcharge = isAfterSurchargeCutoff ? (baseAmount * surchargePercent) / 100 : 0
  const totalAmount = baseAmount + surcharge

  return {
    baseAmount,
    surcharge,
    totalAmount,
    appliedSurcharge: isAfterSurchargeCutoff,
  }
}

/**
 * Check if a payment is overdue
 * @param dueDate - Payment due date
 * @param status - Payment status
 */
export function isPaymentOverdue(dueDate: string, status: string): boolean {
  if (status === 'pagado') return false
  return new Date(dueDate) < new Date()
}

/**
 * Format date in Spanish locale
 */
export function formatDateES(date: string | Date): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return dateObj.toLocaleDateString('es-AR')
}
