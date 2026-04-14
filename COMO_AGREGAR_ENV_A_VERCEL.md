# ⚡ CÓMO AGREGAR .env A VERCEL

## Opción 1: Dashboard de Vercel (RECOMENDADO)

### Paso 1: Ve a Vercel Dashboard
https://vercel.com/dashboard

### Paso 2: Selecciona tu proyecto
Click en `isipp-academic`

### Paso 3: Ve a Settings
Click en **"Settings"** (arriba de la página)

### Paso 4: Environment Variables
En el menú izquierdo → Click en **"Environment Variables"**

### Paso 5: Agrega las variables

Haz clic en **"Add New"** y llena:

#### Primera variable:
```
Name:        VITE_SUPABASE_URL
Value:       https://nubtgvweebyqmjrshtnz.supabase.co
Environment: Production, Preview, Development
```
Click **"Save"**

#### Segunda variable:
```
Name:        VITE_SUPABASE_ANON_KEY
Value:       eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im51YnRndndlZWJ5cW1qcnNodG56Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU1NTM2MDUsImV4cCI6MjA5MTEyOTYwNX0.JhBN3kwfTwDR1wEFkvBbGH_owlduHn64ZfI_TVor-qk
Environment: Production, Preview, Development
```
Click **"Save"**

### Paso 6: Redeploy

Ve a **"Deployments"** → Haz clic en los 3 puntos del deploy actual → **"Redeploy"**

Espera 2-3 minutos y listo ✓

---

## Opción 2: CLI de Vercel (ALTERNATIVA)

Si quieres hacerlo desde terminal:

### Paso 1: Instala Vercel CLI
```bash
npm install -g vercel
```

### Paso 2: Login en Vercel
```bash
vercel login
```

### Paso 3: Link tu proyecto
```bash
vercel link
```

### Paso 4: Copia el .env.local a .env.production
```bash
cp .env.local .env.production
```

### Paso 5: Agrega variables a Vercel
```bash
vercel env add VITE_SUPABASE_URL
# Pega: https://nubtgvweebyqmjrshtnz.supabase.co

vercel env add VITE_SUPABASE_ANON_KEY
# Pega: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im51YnRndndlZWJ5cW1qcnNodG56Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU1NTM2MDUsImV4cCI6MjA5MTEyOTYwNX0.JhBN3kwfTwDR1wEFkvBbGH_owlduHn64ZfI_TVor-qk
```

### Paso 6: Deploy
```bash
vercel --prod
```

---

## ✅ VERIFICAR QUE FUNCIONÓ

### Local (antes de pushear):
```bash
npm run build
npm start
```

Abre `http://localhost:3000` → Debe funcionar todo

### En Vercel:
Abre `https://isipp-academic.vercel.app`

Prueba:
- ✓ Página carga sin errores CSS
- ✓ Botón de login existe
- ✓ Intenta registrarte (debe conectarse a Supabase)

---

## ⚠️ SEGURIDAD: .env.local vs .env

### .env.local (LOCAL)
```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```
✓ Úsalo en tu máquina para testear
✓ NO lo pushes a GitHub

### Vercel Environment Variables (PRODUCCIÓN)
```
VITE_SUPABASE_URL (en dashboard)
VITE_SUPABASE_ANON_KEY (en dashboard)
```
✓ Las configuras en Vercel Dashboard
✓ No necesitas pushear .env

---

## 🔒 .gitignore (VERIFICAR)

Tu `.gitignore` debe tener:
```
.env
.env.local
.env.*.local
```

Verifica:
```bash
cat .gitignore
```

Si no aparecen, agrégalos:
```bash
echo ".env.local" >> .gitignore
git add .gitignore
git commit -m "Add .env.local to gitignore"
git push
```

---

## 📋 RESUMEN

✓ `.env.local` creado en tu máquina
✓ Ahora agrega variables en Vercel Dashboard
✓ Redeploy
✓ Listo!

**Tu app estará en:** https://isipp-academic.vercel.app
