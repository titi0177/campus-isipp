-- =========================================================================
-- Trigger mejorado: handle_new_auth_user_into_students
-- Crea registro en public.students al registrarse en Auth
-- Incluye: dni, legajo, program_id
-- =========================================================================

CREATE OR REPLACE FUNCTION public.handle_new_auth_user_into_students()
RETURNS TRIGGER AS $$
BEGIN
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
    COALESCE(NEW.raw_user_meta_data->>'dni', ''),
    COALESCE(NEW.raw_user_meta_data->>'legajo', ''),
    (NEW.raw_user_meta_data->>'program_id')::UUID,
    'active',
    1
  )
  ON CONFLICT (user_id) DO UPDATE SET
    first_name = COALESCE(NEW.raw_user_meta_data->>'first_name', excluded.first_name),
    last_name = COALESCE(NEW.raw_user_meta_data->>'last_name', excluded.last_name),
    dni = COALESCE(NEW.raw_user_meta_data->>'dni', excluded.dni),
    legajo = COALESCE(NEW.raw_user_meta_data->>'legajo', excluded.legajo),
    program_id = COALESCE((NEW.raw_user_meta_data->>'program_id')::UUID, excluded.program_id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Eliminar trigger anterior si existe
DROP TRIGGER IF EXISTS on_auth_user_created_students ON auth.users;

-- Crear nuevo trigger
CREATE TRIGGER on_auth_user_created_students
  AFTER INSERT ON auth.users
  FOR EACH ROW 
  EXECUTE FUNCTION public.handle_new_auth_user_into_students();

-- =========================================================================
-- Nota: El trigger existente handle_new_user() sigue creando la fila en
-- public.users. Este nuevo trigger crea la fila en public.students.
-- =========================================================================
