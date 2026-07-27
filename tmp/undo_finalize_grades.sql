CREATE OR REPLACE FUNCTION undo_finalize_grades(p_enrollment_grade_id UUID)
RETURNS JSON AS $$
DECLARE
  v_result JSON;
BEGIN
  UPDATE enrollment_grades
  SET
    partial_finalized = false,
    partial_finalized_at = null,
    final_grade = null,
    final_status = null,
    selected_grades_for_averaging = null
  WHERE id = p_enrollment_grade_id;

  v_result := json_build_object('success', true, 'message', 'Cierre de notas deshecho exitosamente');
  RETURN v_result;
EXCEPTION WHEN OTHERS THEN
  v_result := json_build_object('success', false, 'message', SQLERRM);
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
