# ⚡ GUÍA RÁPIDA: 5 MINUTOS PARA DEPLOYAR

## Si quieres ir rápido, sigue ESTO:

### Paso 1: Prepara tu código (1 min)

```bash
git add .
git commit -m "Deploy a Vercel"
git push origin main
```

### Paso 2: Ve a Vercel (30 seg)

https://vercel.com/dashboard → Click "Add New" → "Project"

### Paso 3: Conecta GitHub (1 min)

1. Selecciona tu repo `isipp-academic`
2. Click "Import"

### Paso 4: Agrega variables de entorno (2 min)

Click en "Environment Variables" y agrega:

```
VITE_SUPABASE_URL = https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY = eyJxxx...
```

*(Cópialas de https://app.supabase.com → Settings → API)*

### Paso 5: Deploy (1 min)

Click "Deploy"

Espera 2-5 minutos...

✓ LISTO! Tu app está en: https://isipp-academic.vercel.app

---

## ¿De dónde saco las claves?

1. Ve a https://app.supabase.com
2. Selecciona tu proyecto
3. Settings → API
4. Copia:
   - **Project URL** 
   - **anon public key** (la más larga)

Pega en Vercel y listo.

---

## ¿Funciona?

Abre en navegador:
- https://isipp-academic.vercel.app
- Debe ver login
- Intenta registrarte

Si sale error, checkea:
1. ¿Las claves de Supabase son correctas?
2. ¿CORS está habilitado? (Supabase → Settings → API → CORS)

---

## Actualizaciones futuras

Cada vez que hagas:
```bash
git push origin main
```

Vercel automáticamente:
1. Compila tu código
2. Deploya los cambios
3. Tu sitio se actualiza

DONE! 🚀
