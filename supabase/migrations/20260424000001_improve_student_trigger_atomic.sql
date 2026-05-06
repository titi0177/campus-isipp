-- =========================================================================
-- Trigger mejorado: handle_new_auth_user_into_students
-- Ahora valida legajo/DNI duplicados ANTES de insertar
-- Si hay duplicado, rechaza el INSERT en auth.users (transacción atómica)
-- Esto evita cuentas huérfanas
-- =========================================================================

CREATE OR REPLACE FUNCTION public.handle_new_auth_user_into_students()
RETURNS TRIGGER AS $$
DECLARE
  v_program_id UUID;
  v_legajo TEXT;
  v_dni TEXT;
BEGIN
  -- Extraer valores de metadatos
  v_program_id := (NEW.raw_user_meta_data->>'program_id')::UUID;
  v_legajo := NEW.raw_user_meta_data->>'legajo';
  v_dni := NEW.raw_user_meta_data->>'dni';
  
  -- ✅ VALIDAR: Legajo duplicado
  IF v_legajo IS NOT NULL AND v_legajo != '' THEN
    IF EXISTS(
      SELECT 1 FROM public.students 
      WHERE legajo = v_legajo
    ) THEN
      RAISE EXCEPTION 'El legajo % ya está registrado en el sistema', v_legajo;
    END IF;
  END IF;
  
  -- ✅ VALIDAR: DNI duplicado
  IF v_dni IS NOT NULL AND v_dni != '' THEN
    IF EXISTS(
      SELECT 1 FROM public.students 
      WHERE dni = v_dni
    ) THEN
      RAISE EXCEPTION 'El DNI % ya está registrado en el sistema', v_dni;
    END IF;
  END IF;
  
  -- Si pasa todas las validaciones, insertar el estudiante
  INSERT INTO public.students (
    user_id,
    first_name,
    last_name,
    email,
    dni,
    legajo,
    program_id,
    status,
    year
  ) VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    NEW.email,
    v_dni,
    v_legajo,
    v_program_id,
    'active',
    1
  );
  
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- ⚠️ IMPORTANTE: 
  -- Al lanzar excepción aquí, la transacción se cancela
  -- Esto previene que quede un usuario huérfano en auth.users
  -- La excepción se propaga a Supabase Auth, que rechaza el INSERT completo
  RAISE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Eliminar trigger anterior si existe
DROP TRIGGER IF EXISTS on_auth_user_created_students ON auth.users;

-- Crear nuevo trigger con validaciones mejoradas
CREATE TRIGGER on_auth_user_created_students
  AFTER INSERT ON auth.users
  FOR EACH ROW 
  EXECUTE FUNCTION public.handle_new_auth_user_into_students();
