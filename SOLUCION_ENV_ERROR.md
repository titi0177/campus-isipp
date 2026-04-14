# 🔧 SOLUCIÓN: COMO AGREGAR VARIABLES EN VERCEL (PASO A PASO CON FOTOS)

## ❌ LO QUE HICISTE (INCORRECTO)

Pegaste en el campo "Value":
```
VITE_SUPABASE_URL=https://nubtgvweebyqmjrshtnz.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...
```

❌ ESTO ES INCORRECTO porque:
- Incluiste el `VITE_SUPABASE_URL=`
- Incluiste ambas variables juntas
- Vercel lo interpretó como un nombre de Secret, no como un valor

---

## ✅ LO CORRECTO

### PASO 1: Ve a Vercel Dashboard
https://vercel.com/dashboard

### PASO 2: Selecciona tu proyecto
Click en **isipp-academic**

### PASO 3: Settings
Click en **"Settings"** (arriba)

### PASO 4: Environment Variables
En menú izquierdo → **"Environment Variables"**

### PASO 5: Borra las variables que pusiste mal

Si ves algo como:
```
VITE_SUPABASE_URL = supabase_url  ❌
VITE_SUPABASE_ANON_KEY = eyJ...   ❌
```

Haz clic en el "🗑️" (basurero) para borrar cada una.

---

## ✅ PASO 6: AGREGA CORRECTAMENTE

### Variable 1: URL

Haz clic en **"Add New Environment Variable"**

**CAMPO "Name":**
```
VITE_SUPABASE_URL
```

**CAMPO "Value":**
```
https://nubtgvweebyqmjrshtnz.supabase.co
```

**CAMPO "Environments":**
```
☑ Production
☑ Preview  
☑ Development
```

Click **"Save"**

---

### Variable 2: CLAVE

Haz clic en **"Add New Environment Variable"**

**CAMPO "Name":**
```
VITE_SUPABASE_ANON_KEY
```

**CAMPO "Value":**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im51YnRndndlZWJ5cW1qcnNodG56Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU1NTM2MDUsImV4cCI6MjA5MTEyOTYwNX0.JhBN3kwfTwDR1wEFkvBbGH_owlduHn64ZfI_TVor-qk
```

**CAMPO "Environments":**
```
☑ Production
☑ Preview
☑ Development
```

Click **"Save"**

---

## ✅ PASO 7: REDEPLOY

1. Ve a **"Deployments"** (pestaña arriba)
2. Haz clic en los **3 puntos (...)** del deploy más reciente
3. Click en **"Redeploy"**

Espera 2-5 minutos...

Debe mostrar: **✓ Ready**

---

## ✅ VERIFICA

Abre: https://isipp-academic.vercel.app

Debe funcionar sin errores.

---

## 📋 RESUMEN

**INCORRECTO:**
```
Name: VITE_SUPABASE_URL
Value: VITE_SUPABASE_URL=https://...  ❌
```

**CORRECTO:**
```
Name: VITE_SUPABASE_URL
Value: https://nubtgvweebyqmjrshtnz.supabase.co  ✓
```

**LA DIFERENCIA:**
- ❌ Incluiste el nombre y el `=`
- ✓ Solo el valor puro

---

## 💡 RECUERDA

En Vercel, cada variable tiene 2 partes:

```
┌─────────────────────────────────┐
│ Name  │ VITE_SUPABASE_URL       │ ← El nombre
├───────┼─────────────────────────┤
│ Value │ https://nubtvw...co     │ ← Solo el URL
└─────────────────────────────────┘
```

NO hagas:
```
Name  │ VITE_SUPABASE_URL=https://...  ❌
Value │ xxx
```

SIEMPRE:
```
Name  │ VITE_SUPABASE_URL               ✓
Value │ https://...
```

---

## ✅ LISTO!

Inténtalo ahora. Si ves el mismo error, cuéntame exactamente qué ves en el campo "Value".
