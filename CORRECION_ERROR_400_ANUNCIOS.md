# ✅ SOLUCIÓN: Error 400 en Anuncios

## 🐛 Problema

```
POST https://nubtgvweebyqmjrshtnz.supabase.co/rest/v1/announcements 400 (Bad Request)
```

Al intentar crear o editar un anuncio, se obtenía un error 400.

---

## 🔍 Causa Encontrada

En el archivo `src/routes/admin/announcements.tsx`, el formulario estaba usando el campo incorrecto:

**❌ INCORRECTO:**
```tsx
<textarea 
  value={editing.content || ''}  // ← Campo incorrecto
  onChange={e => setEditing(p => ({ ...p, content: e.target.value }))}
/>
```

Pero la tabla `announcements` en Supabase define el campo como `description`, no `content`:

**Tipo correcto (en `src/types/index.ts`):**
```tsx
export interface Announcement {
  id: string
  title: string
  description: string  // ← El campo correcto
  date: string
  created_at: string
}
```

---

## ✅ Solución Aplicada

Cambiar `content` a `description` en el formulario:

**✅ CORRECTO:**
```tsx
<textarea 
  value={editing.description || ''}  // ← Campo correcto
  onChange={e => setEditing(p => ({ ...p, description: e.target.value }))}
/>
```

---

## 📝 Cambios Realizados

En `src/routes/admin/announcements.tsx`:

1. **Línea del textarea:** Cambiar `content` → `description`
2. **Estado inicial:** Agregar `description: ''` al objeto vacío
3. **Manejo de errores:** Agregar try/catch con mensajes de error
4. **Placeholders:** Agregar ejemplos en los inputs

---

## 🧪 Cómo Probar

1. Ve a `/admin/announcements`
2. Haz clic en "Nuevo Anuncio"
3. Completa los campos:
   - Título: "Clausura de inscripciones"
   - Descripción: "A partir del 15 de diciembre..."
   - Fecha: Selecciona una fecha
4. Haz clic en "Publicar"
5. ✅ Debería funcionar sin error 400

---

## 📊 Resumen

| Aspecto | Antes | Después |
|--------|-------|---------|
| Campo usado | `content` | `description` ✅ |
| Error | 400 Bad Request | Funciona correctamente ✅ |
| Mensajes error | Sin mensajes | Con try/catch ✅ |
| UX | Sin feedback | Con toast de éxito/error ✅ |

---

## ✨ Cambios Adicionales

- Agregado handling de errores con try/catch
- Mejorados mensajes de éxito/error con Toast
- Agregados placeholders en inputs
- Mejorada legibilidad del código

---

## 🚀 Estado

**✅ CORREGIDO Y FUNCIONANDO**

Los anuncios ahora se pueden crear, editar y eliminar sin problemas.

Commit: `03dd7f86`
