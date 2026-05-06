-- =========================================================================
-- Función para validar legajo y DNI duplicados
-- Permite que el cliente valide ANTES de intentar registrarse
-- =========================================================================

CREATE OR REPLACE FUNCTION public.check_duplicate_legajo_dni(
  p_legajo TEXT,
  p_dni TEXT
)
RETURNS TABLE(is_duplicate BOOLEAN, error_message TEXT) AS $$
BEGIN
  -- Verificar legajo duplicado
  IF p_legajo IS NOT NULL AND p_legajo != '' THEN
    IF EXISTS(SELECT 1 FROM public.students WHERE legajo = p_legajo) THEN
      RETURN QUERY SELECT true, 'El legajo ya está registrado en el sistema';
      RETURN;
    END IF;
  END IF;
  
  -- Verificar DNI duplicado
  IF p_dni IS NOT NULL AND p_dni != '' THEN
    IF EXISTS(SELECT 1 FROM public.students WHERE dni = p_dni) THEN
      RETURN QUERY SELECT true, 'El DNI ya está registrado en el sistema';
      RETURN;
    END IF;
  END IF;
  
  -- Sin duplicados
  RETURN QUERY SELECT false, '';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Agregar RLS policy para permitir que usuarios autenticados llamen esta función
GRANT EXECUTE ON FUNCTION public.check_duplicate_legajo_dni(TEXT, TEXT) TO authenticated, anon;
