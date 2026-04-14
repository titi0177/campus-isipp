-- =========================================================================
-- INSTRUCCIONES: Ejecutar en Supabase para activar Configuración de Pagos
-- =========================================================================

-- Paso 1: Actualizar el CHECK de roles en la tabla users
-- (Esto ya está en SQL_SUPABASE_EN_ORDEN.sql, pero si la tabla ya existe, ejecuta esto:)
ALTER TABLE public.users
DROP CONSTRAINT users_role_check;

ALTER TABLE public.users
ADD CONSTRAINT users_role_check CHECK (role IN ('admin', 'student', 'professor', 'treasurer'));

-- Paso 2: Ejecutar la migración completa
-- Copia el contenido de: supabase/migrations/payment_configuration_and_audit.sql
-- y pégalo en el SQL Editor de Supabase → Click en "Run"

-- Paso 3: IMPORTANTE - Crear o actualizar un usuario como TESORERO
-- En la tabla public.users, actualiza un usuario existente a rol 'treasurer':
UPDATE public.users
SET role = 'treasurer'
WHERE email = 'tesorero@isipp.edu.ar';  -- Reemplaza con el email del tesorero

-- Paso 4: Verificar que las políticas funcionen
-- Selecciona un usuario como tesorero en Supabase:
-- 1. Ve a Authentication → Users
-- 2. Abre el usuario del tesorero
-- 3. Copiar su User ID
-- 4. En el SQL Editor, ejecuta:
SELECT auth.jwt() as token;
-- Nota: Esto es para testing local. En producción, el usuario accede normalmente.

-- Paso 5: Probar creación de configuración
-- Si todo funciona, el tesorero podrá:
-- - Leer todas las configuraciones de pago
-- - Crear nuevas configuraciones
-- - Actualizar configuraciones existentes
-- - Ver el historial de auditoría

-- =========================================================================
-- VERIFICACIÓN
-- =========================================================================

-- Ver configuraciones de pago creadas:
SELECT * FROM public.payment_configuration;

-- Ver historial de cambios:
SELECT * FROM public.payment_configuration_audit ORDER BY changed_at DESC;

-- Ver roles de usuarios:
SELECT id, email, role FROM public.users LIMIT 10;

-- =========================================================================
-- NOTA IMPORTANTE
-- =========================================================================
-- Si el tesorero sigue recibiendo error 403 (Forbidden):
-- 1. Verifica que su rol sea exactamente 'treasurer' (sin espacios)
-- 2. Recarga la página del navegador (hard refresh: Ctrl+Shift+R o Cmd+Shift+R)
-- 3. Si aún falla, copia el error exacto y revisa las políticas RLS
