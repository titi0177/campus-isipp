-- =============================================================================
-- DIAGNÓSTICO Y LIMPIEZA: Correlativas con required_status NULL o inválido
-- =============================================================================

-- 1) Ver cuántas correlativas tiene problemas
SELECT COUNT(*) as problematicas
FROM public.subject_correlatives
WHERE required_status IS NULL 
   OR required_status NOT IN ('aprobado', 'regular', 'any');

-- 2) Ver detalles de las correlativas problemáticas
SELECT 
  sc.id,
  s1.name as subject_name,
  s2.name as requires_name,
  sc.required_status,
  sc.created_at
FROM public.subject_correlatives sc
JOIN public.subjects s1 ON s1.id = sc.subject_id
JOIN public.subjects s2 ON s2.id = sc.requires_subject_id
WHERE required_status IS NULL 
   OR required_status NOT IN ('aprobado', 'regular', 'any')
ORDER BY s1.name;

-- 3) SOLUCIÓN: Actualizar todas las correlativas NULL/inválidas a 'aprobado'
UPDATE public.subject_correlatives
SET required_status = 'aprobado'
WHERE required_status IS NULL 
   OR required_status NOT IN ('aprobado', 'regular', 'any');

-- 4) Verificar que todas ahora son válidas
SELECT 
  required_status,
  COUNT(*) as cantidad
FROM public.subject_correlatives
GROUP BY required_status
ORDER BY required_status;

-- =============================================================================
-- RESULTADO ESPERADO:
-- required_status | cantidad
-- -------|----------
-- aprobado | (número total)
-- regular | (número total)
-- any | (número total)
-- =============================================================================
