-- Script para copiar materias del 1° y 2° año de Analista a Redes
-- Reemplaza los IDs según tu BD

-- 1. Obtén el ID de la carrera "Redes"
-- SELECT id FROM programs WHERE name = 'Redes';

-- 2. Obtén el ID de "Analista"
-- SELECT id FROM programs WHERE name = 'Analista';

-- 3. Ejecuta este INSERT (reemplaza los program_id)
INSERT INTO subjects (
  name, code, year, credits, program_id, professor_id,
  allows_promotion, dictation_type, semester
)
SELECT 
  name, 
  code || '_REDES' as code,  -- Agrega _REDES al código para diferenciar
  year, 
  credits, 
  'PROGRAM_ID_REDES'::uuid as program_id,  -- Reemplaza con ID de Redes
  professor_id,
  allows_promotion, 
  dictation_type, 
  semester
FROM subjects
WHERE program_id = 'PROGRAM_ID_ANALISTA'::uuid  -- Reemplaza con ID de Analista
  AND year IN (1, 2);  -- Solo 1° y 2° año

-- Nota: Si no quieres el sufijo _REDES en el código, usa:
-- code as code,  -- sin el || '_REDES'
