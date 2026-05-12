-- =============================================================================
-- MIGRATION: Actualizar UNIQUE constraint para permitir múltiples requisitos
-- por la misma correlativa (ej: Seguridad 1 con 'regular' y 'aprobado')
-- =============================================================================
-- Este script modifica subject_correlatives para permitir:
-- ERGONOMIA -> SEGURIDAD_1 con required_status='regular'
-- ERGONOMIA -> SEGURIDAD_1 con required_status='aprobado'
-- =============================================================================

-- Paso 1: Remover constraint UNIQUE antiguo
ALTER TABLE public.subject_correlatives
DROP CONSTRAINT IF EXISTS subject_correlatives_subject_id_requires_subject_id_key;

-- Paso 2: Agregar UNIQUE constraint nuevo que incluya required_status
ALTER TABLE public.subject_correlatives
ADD CONSTRAINT subject_correlatives_unique_with_status 
UNIQUE (subject_id, requires_subject_id, required_status);

-- Paso 3: Recrear índices para optimización
DROP INDEX IF EXISTS idx_subject_correlatives_by_status;
DROP INDEX IF EXISTS idx_subject_correlatives_requires;

CREATE INDEX idx_subject_correlatives_by_status 
ON public.subject_correlatives(subject_id, required_status);

CREATE INDEX idx_subject_correlatives_requires 
ON public.subject_correlatives(requires_subject_id);

-- =============================================================================
-- RESULTADO:
-- =============================================================================
-- Ahora puedes tener:
-- (ERGONOMIA, SEGURIDAD_1, 'regular')    ← Para cursar
-- (ERGONOMIA, SEGURIDAD_1, 'aprobado')   ← Para examen final
--
-- El UNIQUE constraint permite esto porque incluye required_status.
-- Si intentas duplicar exactamente la misma combinación, fallaría.
-- =============================================================================
