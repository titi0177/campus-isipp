-- =========================================================================
-- ELIMINAR el trigger que crea students automáticamente
-- Este trigger causa conflicto porque intenta crear un registro que ya existe
-- =========================================================================

-- Eliminar el trigger
DROP TRIGGER IF EXISTS on_auth_user_created_students ON auth.users;

-- Eliminar la función del trigger
DROP FUNCTION IF EXISTS public.handle_new_auth_user_into_students();

-- Verificar que se eliminó
SELECT trigger_name 
FROM information_schema.triggers 
WHERE event_object_table = 'users' 
  AND trigger_name = 'on_auth_user_created_students';
-- Debería devolver 0 filas si se eliminó correctamente
