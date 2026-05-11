-- ============================================================================
-- SQL PARA AGREGAR SOPORTE DE ANUNCIOS INSTITUCIONALES AL LOGIN
-- ============================================================================
-- Ejecutar esta consulta en Supabase > SQL Editor
-- Tiempo: ~2 segundos
-- ============================================================================

-- Agregar columna 'show_at_login' a tabla announcements
-- Esta columna permite a admin marcar qué anuncios mostrar al iniciar sesión
-- El modal aparecerá automáticamente después del login si hay anuncios con show_at_login = true
ALTER TABLE announcements 
ADD COLUMN IF NOT EXISTS show_at_login BOOLEAN DEFAULT false;

-- Verificación (opcional - ejecuta después para confirmar)
-- SELECT id, title, show_at_login FROM announcements LIMIT 5;

-- ============================================================================
-- INSTRUCCIONES DE USO:
-- ============================================================================
-- 1. En Admin Panel > Anuncios: marca "Mostrar al login" para anuncios importantes
-- 2. Los anuncios aparecerán en modal después que el usuario inicie sesión
-- 3. El usuario puede navegar entre anuncios (anterior/siguiente)
-- 4. Al cerrar el modal, se muestra el dashboard normalmente
-- 5. Los anuncios se pueden cambiar/actualizar en cualquier momento
-- ============================================================================
