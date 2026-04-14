import { useCallback, useRef, useEffect, useState, useMemo } from 'react'
import { supabase } from '@/lib/supabase'

/**
 * Hook para exportar datos a Excel con lazy loading
 */
export function useExcelExport() {
  const exportToExcel = useCallback(async (data: any[], filename: string, sheetName: string = 'Reporte') => {
    try {
      // Lazy load xlsx only when needed
      const XLSX = await import('xlsx').then(m => m.default)
      
      // Create worksheet from data
      const worksheet = XLSX.utils.json_to_sheet(data)
      
      // Create workbook
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, sheetName)
      
      // Write file
      XLSX.writeFile(workbook, `${filename}.xlsx`)
    } catch (err) {
      console.error('Error exporting to Excel:', err)
      throw err
    }
  }, [])

  return { exportToExcel }
}
