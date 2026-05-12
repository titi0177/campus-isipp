-- =============================================================================
-- PREREQUISITE SYSTEM MIGRATION FOR ISIPP
-- Adds support for differentiated course enrollment vs final exam prerequisites
-- =============================================================================

-- 1) Add required_status column to subject_correlatives
-- This column specifies what academic status is required for the prerequisite:
--   - 'aprobado': Student must have APROBADA or PROMOCIONADA (for exam final only)
--   - 'regular': Student can have APROBADA, PROMOCIONADA, or REGULARIZADA (for course enrollment)
--   - 'any': No restriction on status (prerequisite check disabled)

ALTER TABLE public.subject_correlatives
ADD COLUMN IF NOT EXISTS required_status TEXT DEFAULT 'aprobado'
CHECK (required_status IN ('aprobado', 'regular', 'any'));

-- 2) Create index for performance optimization when querying by subject_id and required_status
CREATE INDEX IF NOT EXISTS idx_subject_correlatives_by_status 
ON public.subject_correlatives(subject_id, required_status);

-- =============================================================================
-- BEHAVIOR CHANGES
-- =============================================================================
-- 
-- COURSE ENROLLMENT (enroll-subjects.tsx):
--   - Validates that required correlatives exist in subject_correlatives
--   - Checks student's final_status for each prerequisite
--   - For required_status='regular': accepts APROBADA, PROMOCIONADA, or REGULARIZADA
--   - For required_status='aprobado': accepts only APROBADA or PROMOCIONADA
--   - For required_status='any': skips validation entirely
--   - Message shows "Requiere: [subject names]"
--
-- FINAL EXAM REGISTRATION (exams.tsx):
--   - Validates that required correlatives exist in subject_correlatives
--   - Checks student's final_status for each prerequisite
--   - For required_status='aprobado': accepts only APROBADA or PROMOCIONADO
--   - For required_status='regular': also accepts REGULARIZADA
--   - For required_status='any': skips validation entirely
--   - Message shows specific reason: "Requiere APROBADA: [subject]" or "Requiere REGULARIZADA: [subject]"
--
-- ADMIN PANEL (correlatives.tsx):
--   - Added radio buttons to select required_status for each prerequisite
--   - Visual indicators show the type of requirement in the preview section
--   - Colors: Red (aprobado), Amber (regular), Gray (any)
--
-- =============================================================================
-- DEPLOYMENT NOTES
-- =============================================================================
-- 
-- 1. Run this SQL in Supabase SQL Editor to add the column
-- 2. Existing correlatives will default to required_status='aprobado' (backward compatible)
-- 3. Deploy the updated frontend files (enroll-subjects.tsx, exams.tsx, correlatives.tsx)
-- 4. Test enrollment and exam registration flows in both stages
-- 5. Use the admin panel to adjust required_status values for each prerequisite
--
-- =============================================================================
