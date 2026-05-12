-- =============================================================================
-- MIGRATION: Add required_status to subject_correlatives
-- =============================================================================
-- This migration adds support for differentiating prerequisites:
-- - 'aprobado': Requires APROBADA/PROMOCIONADA (for final exams only)
-- - 'regular': Accepts APROBADA/PROMOCIONADA/REGULARIZADA (for course enrollment)
-- - 'any': No restriction
--
-- Run this SQL in Supabase SQL Editor after the main schema is created.
-- =============================================================================

-- Add the required_status column with default value
ALTER TABLE public.subject_correlatives
  ADD COLUMN IF NOT EXISTS required_status TEXT DEFAULT 'aprobado'
  CHECK (required_status IN ('aprobado', 'regular', 'any'));

-- Create index for performance optimization
CREATE INDEX IF NOT EXISTS idx_subject_correlatives_by_status 
ON public.subject_correlatives(subject_id, required_status);

-- Create index for reverse lookup by required subject
CREATE INDEX IF NOT EXISTS idx_subject_correlatives_requires 
ON public.subject_correlatives(requires_subject_id);

-- Done!
