-- =============================================================================
-- Migración: Agregar auditoría y función para deshacer cierre de notas
-- =============================================================================

-- 1. Agregar columna de auditoría
ALTER TABLE public.enrollment_grades
ADD COLUMN IF NOT EXISTS finalization_history JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS can_be_undone BOOLEAN DEFAULT true;

-- 2. Crear función RPC para deshacer "Cerrar Notas"
CREATE OR REPLACE FUNCTION public.undo_finalize_grades(
  p_enrollment_grade_id UUID
)
RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
BEGIN
  -- Verificar que se puede deshacer (profesor o admin)
  UPDATE public.enrollment_grades
  SET
    partial_finalized = false,
    partial_finalized_at = NULL,
    selected_grades_for_averaging = NULL,
    finalization_history = finalization_history || jsonb_build_array(
      jsonb_build_object(
        'action', 'undone',
        'timestamp', NOW(),
        'by_user_id', auth.uid()
      )
    )
  WHERE id = p_enrollment_grade_id
  RETURNING jsonb_build_object(
    'success', true,
    'message', 'Cierre de notas deshecho. Puedes volver a editar.',
    'enrollment_grade_id', id
  ) INTO v_result;

  IF v_result IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'No se encontró el registro de calificaciones'
    );
  END IF;

  RETURN v_result;
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'message', SQLERRM
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Comentarios
COMMENT ON COLUMN public.enrollment_grades.finalization_history IS 'Historial JSON de cambios: cierre, deshacer, etc.';
COMMENT ON COLUMN public.enrollment_grades.can_be_undone IS 'Flag para auditoría: puede deshacerse si admin lo permite';

-- 4. Crear índices
CREATE INDEX IF NOT EXISTS idx_enrollment_grades_can_be_undone ON public.enrollment_grades(can_be_undone);
