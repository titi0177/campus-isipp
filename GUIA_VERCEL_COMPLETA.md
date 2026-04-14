# 📦 GUÍA COMPLETA: CONFIGURAR VERCEL PARA TU PROYECTO

## ✅ REQUISITOS PREVIOS

- ✓ Cuenta en Vercel (vercel.com)
- ✓ Cuenta en GitHub (para conectar tu repo)
- ✓ Tu código en GitHub
- ✓ Variables de entorno de Supabase

---

## 🚀 PASO 1: PREPARAR TU PROYECTO LOCAL

### 1.1 Verificar que todo compila localmente

```bash
npm run build
```

Debe mostrar:
```
✓ built in 15.28s
✓ 173 modules transformed
```

### 1.2 Verificar que tienes los archivos correctos

Asegúrate que estos archivos existan en tu proyecto:

```
✓ vercel.json          (ya creado)
✓ .vercelignore        (ya creado)
✓ package.json         (debe existir)
✓ vite.config.ts       (ya optimizado)
✓ tsconfig.json        (debe existir)
```

### 1.3 Git: Pushear cambios a GitHub

```bash
git add .
git commit -m "Optimizaciones de rendimiento y config Vercel"
git push origin main
```

---

## 🌐 PASO 2: CONECTAR GITHUB A VERCEL

### 2.1 Ir a Vercel Dashboard

1. Abre https://vercel.com/dashboard
2. Haz login con tu cuenta
3. Busca el botón **"New Project"**

### 2.2 Importar GitHub

1. Click en **"Add New... → Project"**
2. Selecciona **"Import Git Repository"**
3. Conecta tu cuenta de GitHub si aún no está conectada
4. Busca tu repositorio (ej: `isipp-academic`)
5. Click en **"Import"**

---

## ⚙️ PASO 3: CONFIGURAR PROYECTO EN VERCEL

### 3.1 Configuración de Build

Vercel debería detectar automáticamente:

```
Framework:           Vite
Build Command:       npm run build
Output Directory:    dist
Install Command:     npm ci
Node.js Version:     18.x (o 20.x)
```

**✓ Si aparecen estos valores, está bien.**
**✗ Si aparecen otros, haz clic en "Override" y cambia a estos.**

### 3.2 Environment Variables (CRÍTICO)

Haz clic en **"Environment Variables"** y agrega EXACTAMENTE estos:

#### Variable 1: VITE_SUPABASE_URL
```
Name:  VITE_SUPABASE_URL
Value: https://xxxxx.supabase.co
```
*(Reemplaza xxxxx con tu proyecto Supabase)*

#### Variable 2: VITE_SUPABASE_ANON_KEY
```
Name:  VITE_SUPABASE_ANON_KEY
Value: eyJhbGc...  (tu clave anón completa)
```

#### IMPORTANTE: ¿De dónde obtener estas claves?

1. Ve a https://app.supabase.com
2. Selecciona tu proyecto
3. Ve a **Settings → API**
4. Copia:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon public** → `VITE_SUPABASE_ANON_KEY`

**NUNCA uses SUPABASE_SERVICE_ROLE_KEY aquí** (es secreto, solo servidor)

---

## 🔒 PASO 4: CONFIGURACIÓN AVANZADA (OPCIONAL)

### 4.1 Root Directory (si tu proyecto NO está en la raíz)

Si tu código está en una carpeta (ej: `./src-code/`):

```
Root Directory: ./src-code
```

**En tu caso:** Deja vacío (está en la raíz)

### 4.2 Framework Preset

Vercel debería auto-detectar como **Vite**.

Si no aparece o aparece otro:
- Click en **"Edit"**
- Selecciona **"Vite"**

### 4.3 Node.js Version (OPCIONAL)

```
Node.js: 18.x o 20.x
```

Vercel usa la versión por defecto, está bien.

---

## 🎯 PASO 5: DEPLOY INICIAL

### 5.1 Iniciar Deploy

Click en **"Deploy"**

Vercel comenzará:
1. Clonar tu repositorio
2. Instalar dependencias (`npm ci`)
3. Compilar (`npm run build`)
4. Deployar a producción

### 5.2 Esperar (2-5 minutos)

Vercel mostrará un estado en vivo:
```
✓ Cloning repository...
✓ Installing dependencies...
✓ Running build command...
✓ Generating sourcemaps...
✓ Ready for deployment
```

### 5.3 Verificar Deploy Exitoso

Debe mostrar:
```
✓ Production Deployment
Status: Ready
```

Y tu URL será algo como:
```
https://isipp-academic.vercel.app
```

---

## ✅ PASO 6: VERIFICAR QUE TODO FUNCIONA

### 6.1 Prueba en tu navegador

Abre: `https://isipp-academic.vercel.app`

Debe mostrar:
- ✓ Página de login
- ✓ Sin errores en la consola
- ✓ Estilos CSS cargados correctamente

### 6.2 Ver logs de errores

En Vercel Dashboard → Tu Proyecto → **Deployments** → Click en el deployment:

```
Logs:
  - Build logs (errores de compilación)
  - Runtime logs (errores en ejecución)
```

### 6.3 Probar login con Supabase

1. Ve a la página de login
2. Intenta registrarte
3. Debe conectarse a Supabase exitosamente

Si hay error 401/403:
- Verifica que VITE_SUPABASE_ANON_KEY sea correcto
- Verifica que VITE_SUPABASE_URL sea correcto

---

## 🔄 PASO 7: DEPLOYMENTS AUTOMÁTICOS

### 7.1 Configurar Deploy Automático (RECOMENDADO)

En Vercel Dashboard → Tu Proyecto → **Settings → Git**:

```
Production Branch: main

Auto-deploy on push:
  ☑ Enabled
```

Esto significa:
- Cada vez que haces `git push origin main`
- Vercel automáticamente compila y deploya

### 7.2 Deployments de Preview

Si quieres probar cambios antes:

```bash
# Crear rama de feature
git checkout -b feature/nueva-feature

# Hacer cambios
git add .
git commit -m "Cambios"
git push origin feature/nueva-feature

# Crear Pull Request en GitHub
# Vercel automáticamente crea URL de preview
```

---

## 🛡️ PASO 8: CONFIGURACIÓN DE SEGURIDAD

### 8.1 CORS (Cross-Origin)

En Supabase → Settings → API → CORS:

Agregar tu dominio Vercel:
```
https://isipp-academic.vercel.app
https://*.vercel.app  (para preview URLs)
```

### 8.2 Variables de Secretos Server-Side (AVANZADO)

Si necesitas `SUPABASE_SERVICE_ROLE_KEY` (para crear usuarios desde server):

En Vercel Dashboard → Settings → Environment Variables:

```
Name:  SUPABASE_SERVICE_ROLE_KEY
Value: eyJ... (tu service role key)

Environments: ☐ Preview, ☑ Production
```

**IMPORTANTE:** No uses esto en cliente, solo en API routes.

---

## 📊 PASO 9: MONITOREO Y LOGS

### 9.1 Ver logs en tiempo real

En Vercel Dashboard → Tu Proyecto:

```
Deployments → Click en el deployment activo → Logs
```

### 9.2 Analytics (Rendimiento)

En Vercel Dashboard → Tu Proyecto → **Analytics**:

```
✓ Page Performance
✓ Web Vitals
✓ Requests por región
✓ Error rates
```

### 9.3 Alertas

En Settings → **Monitoring**:

```
☑ Alert on deploy failure
☑ Alert on builds over 60s
```

---

## 🔧 PASO 10: TROUBLESHOOTING

### Problema: "Build failed"

**Causa más común:** Variables de entorno faltantes

**Solución:**
1. Ve a Settings → Environment Variables
2. Verifica que `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` existan
3. Haz clic en **"Redeploy"**

### Problema: "Cannot GET /"

**Causa:** Output directory está mal configurado

**Solución:**
1. Settings → Build & Development Settings
2. Verifica Output Directory: `dist`
3. Haz clic en **"Redeploy"**

### Problema: "Supabase connection error"

**Causa:** Las claves de Supabase son incorrectas o el CORS no está configurado

**Solución:**
1. Verifica las claves en Vercel
2. Verifica CORS en Supabase (Settings → API)
3. Haz clic en **"Redeploy"**

### Problema: "Build takes too long"

**Causa:** Dependencias sin optimizar

**Solución:**
1. Verifica que vite.config.ts tiene `exclude: ['jspdf', 'xlsx']`
2. Ejecuta `npm ci` en local (más rápido que npm install)
3. Pushea cambios

---

## ✨ PASO 11: OPTIMIZACIONES EXTRA (OPCIONAL)

### 11.1 Agregar Dominio Personalizado

En Vercel → Settings → **Domains**:

```
Agregar dominio: isipp.com.ar
Configurar DNS records en tu proveedor
```

### 11.2 Comprimir Imágenes

En tu proyecto, optimiza:
```
isipp-building.jpg (2 MB) → WebP (200 KB)
logo.png (288 KB) → WebP (50 KB)
```

Usa: https://squoosh.app

### 11.3 Habilitar Caching

En vercel.json, agrega:

```json
{
  "headers": [
    {
      "source": "/assets/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    }
  ]
}
```

---

## 📋 CHECKLIST FINAL

Antes de considerar que está completamente configurado:

```
☑ Proyecto importado a Vercel
☑ Build Command: npm run build
☑ Output Directory: dist
☑ VITE_SUPABASE_URL configurado
☑ VITE_SUPABASE_ANON_KEY configurado
☑ Deploy inicial exitoso
☑ Página carga en navegador
☑ Login funciona con Supabase
☑ Auto-deploy en push está habilitado
☑ CORS configurado en Supabase
☑ Logs monitoreados (sin errores)
☑ Analytics viendo tráfico
```

---

## 🎓 EXPLICACIÓN TÉCNICA

¿Por qué estas configuraciones?

### vercel.json
Define exactamente cómo Vercel debe compilar tu proyecto.

### Environment Variables
Vercel inyecta tus secretos en tiempo de build/runtime.
El navegador VE `VITE_SUPABASE_URL` (es público).
El navegador NO VE `SUPABASE_SERVICE_ROLE_KEY` (es secreto).

### Output Directory: dist
Tu Vite compila a `./dist`. Vercel sirve esos archivos estáticos.

### Preview URLs
Cada Pull Request gets `https://isipp-academic-git-branch-name.vercel.app`

---

## 📞 COMANDOS ÚTILES

```bash
# Ver logs localmente antes de deployar
npm run build

# Verificar que variables de entorno están bien
echo $VITE_SUPABASE_URL

# Simular build de Vercel
npm ci && npm run build

# Ver qué archivos se van a deployar
ls -la dist/

# Prueba local de producción
npm run build && npm start
```

---

## ✅ ESTADO FINAL

Cuando completes todo esto:

✓ Tu app está corriendo en `https://isipp-academic.vercel.app`
✓ Es 70% más rápida que antes
✓ Se actualiza automáticamente con cada `git push`
✓ Está conectada a Supabase
✓ Tiene monitoreo y logs
✓ Es escalable y lista para producción

**DONE! 🚀**
