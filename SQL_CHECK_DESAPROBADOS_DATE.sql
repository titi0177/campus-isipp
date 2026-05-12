-- Corregir: Ver fechas de creación de desaprobados
SELECT 
  DATE(eg.created_at) as fecha,
  COUNT(*) as cantidad
FROM public.enrollment_grades eg
WHERE eg.final_status = 'desaprobado'
GROUP BY DATE(eg.created_at)
ORDER BY DATE(eg.created_at) DESC;
