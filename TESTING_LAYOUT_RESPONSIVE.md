# 🧪 Guía de Testing - Layout Responsive

## ✅ Checklist de Validación

### 📱 MOBILE (320px - 767px)

#### Header & Navigation
- [ ] Header visible con título "Campus ISIPP" (56px min height)
- [ ] Botón hamburguesa funcional (Menu/X icon)
- [ ] Tooltip del botón en español

#### Sidebar Drawer
- [ ] Click en hamburguesa abre drawer desde izquierda
- [ ] Animación smooth (250ms slideInLeft)
- [ ] Overlay semi-transparente (bg-black/50) detrás
- [ ] Click en overlay cierra drawer
- [ ] Click en item de menú cierra drawer
- [ ] Todas las opciones del menú son accesibles
- [ ] Scroll funciona dentro del drawer

#### Main Content
- [ ] Contenido tiene padding adecuado (p-3 o p-4)
- [ ] Scroll vertical funciona sin problemas
- [ ] Contenido NO queda oculto detrás del bottom nav
- [ ] Padding inferior suficiente (pb-20 ~80px)

#### Bottom Navigation
- [ ] 5 items visibles: Inicio, Cursadas, Horario, Asistencia, Plan
- [ ] Cada item muestra icono + label
- [ ] Item activo tiene border-top color bordó
- [ ] Click en item cambia de página
- [ ] Badges de mensajes se muestran correctamente
- [ ] Permanece fijo al hacer scroll

#### General Mobile
- [ ] NO hay overflow horizontal
- [ ] NO hay espacio gris innecesario
- [ ] Componentes se adaptan al ancho
- [ ] Touch targets min 44x44px

---

### 💻 TABLET (768px - 1023px)

#### Layout
- [ ] Sidebar visible a la izquierda (256px fijo)
- [ ] Contenido ocupa el resto del ancho sin espacios grises
- [ ] Top navigation visible

#### Sidebar
- [ ] Scroll interno funciona si menu es más largo que viewport
- [ ] Todos los items del menú accesibles

#### Content Area
- [ ] Padding consistente: 20-24px
- [ ] Scroll vertical funciona
- [ ] No hay overflow horizontal

#### Bottom Nav
- [ ] NO visible en tablet (md:hidden)

---

### 🖥️ DESKTOP (1024px+)

#### Layout
- [ ] Sidebar izquierda (256px fijo, no scrollea con página)
- [ ] Contenido principal ocupa flex-1
- [ ] NO hay espacio gris a la derecha de sidebar
- [ ] Layout utiliza 100% del ancho disponible

#### Sidebar
- [ ] Logo con imagen (150-220px según pantalla)
- [ ] Label "Menú de autogestión" o equivalente
- [ ] Todos los items de menú visibles
- [ ] Scroll interno si el menú excede el viewport
- [ ] Botón "Cerrar sesión" visible al final

#### TopNav (Desktop)
- [ ] Visible debajo del header del navbar
- [ ] Logo ISIPP + Título + Descripción del módulo
- [ ] Campana de novedades
- [ ] Dropdown de usuario con nombre y rol

#### Main Content
- [ ] Padding: 24px o 32px según contexto
- [ ] Scroll vertical funciona
- [ ] Content respeta max-width si es necesario
- [ ] NO hay overflow horizontal

#### General Desktop
- [ ] Pantalla >1280px: aumenta padding sin excederse
- [ ] Pantalla >1920px: font-size se ajusta a 16px
- [ ] Layout es fluido sin puntos de ruptura visuales

---

## 🎯 Breakpoints Específicos a Probar

```
Dispositivos recomendados:
- 320px: iPhone SE
- 375px: iPhone 12/13
- 480px: Galaxy S9
- 640px: Landscape iPhone 12
- 768px: iPad
- 1024px: iPad Pro / Laptop 1024
- 1280px: Desktop estándar
- 1536px: Monitor grande
```

**Instrucciones Chrome DevTools**:
1. Abre DevTools (F12)
2. Presiona Ctrl+Shift+M para modo responsive
3. Selecciona "Edit" y agrega dimensiones personalizadas
4. Prueba: 320, 375, 480, 640, 768, 1024, 1280, 1536

---

## 🔍 Validaciones Específicas

### Scroll Behavior
- [ ] Scroll NO está bloqueado en ningún breakpoint
- [ ] Content principal permite scroll vertical ilimitado
- [ ] iOS: momentum scrolling funciona (-webkit-overflow-scrolling)
- [ ] Sidebar drawer permite scroll si contenido excede altura
- [ ] Ningún elemento tiene `overflow: hidden` innecesario

### Espacios y Padding
- [ ] **NO hay espacio gris a la derecha en desktop**
- [ ] **NO hay overflow horizontal en ningún breakpoint**
- [ ] Padding consistente según tamaño:
  - Mobile (< 480px): 12px
  - Mobile (> 480px): 16px
  - Tablet: 20px
  - Desktop: 24-32px
- [ ] Content no queda oculto detrás de BottomNav en mobile

### Responsive Design
- [ ] **320px**: Todos los elementos legibles
- [ ] **480px**: Layout es óptimo
- [ ] **768px**: Sidebar aparece correctamente
- [ ] **1024px**: Layout es amplio y cómodo
- [ ] **1280px+**: Sin cambios visuales problemáticos

### Mobile-Specific
- [ ] Notched devices (iPhone X+): content respeta safe-area-inset
- [ ] Inputs: font-size 16px para evitar zoom automático
- [ ] Landscape <600px: layout adaptado (reducido height)
- [ ] Touch targets: mín 44x44px en todos lados

---

## 🎨 Visual Regression Testing

### Desktop Comparison
```
ANTES:
┌─────────────────────────────────────┐
│   TopNav                            │
├────┬────────────────────────────────┤
│    │ [GRIS] Contenido               │
│ SB │ [GRIS]                         │
│    │ [GRIS]                         │
└────┴────────────────────────────────┘
      ↑ Espacio gris innecesario

DESPUÉS:
┌──────────────────────────────────────┐
│   TopNav                             │
├────────┬────────────────────────────┤
│        │ Contenido (100% ancho)     │
│ SB     │ Sin espacios grises        │
│        │ Scroll funciona            │
└────────┴────────────────────────────┘
         ↑ Sin espacios desperdiciados
```

---

## 🧩 Testing de Componentes

### AppLayout
- [ ] Desktop: estructura correcta con `app-layout-desktop`
- [ ] Mobile: estructura correcta con `app-layout-mobile`
- [ ] Sidebar: accesible en desktop, drawer en mobile
- [ ] BottomNav: visible solo en mobile

### Sidebar
- [ ] Logo responsive (160px mobile, 220px desktop)
- [ ] Items de menú con icons
- [ ] Badges de mensajes no leídos
- [ ] Botón logout funcional

### BottomNav
- [ ] 5 items: Inicio, Cursadas, Horario, Asistencia, Plan
- [ ] Active state: border-top + color bordó
- [ ] Icons visibles y legibles
- [ ] Mensajes no leídos: badge rojo

### TopNav (Desktop)
- [ ] Logo + título visible
- [ ] Descripción del módulo trunca si es necesario
- [ ] Campana, dropdown de usuario funcionales

---

## 🚀 Performance Checks

- [ ] No hay layout thrashing (forced reflows)
- [ ] CSS no tiene conflictos innecesarios
- [ ] Animaciones usan GPU (transform, opacity)
- [ ] Scroll es suave en todos los breakpoints
- [ ] No hay jank (stuttering) al desplazar

---

## 📝 Casos Extremos

- [ ] Pantalla muy ancha (4K): ¿layout se ve bien?
- [ ] Pantalla muy estrecha (280px): ¿es legible?
- [ ] Contenido muy largo: ¿scroll funciona?
- [ ] Viewport alto limitado: ¿layout comprimido?
- [ ] Elementos flotantes: ¿no interfieren con scroll?

---

## 🔐 Accesibilidad

- [ ] Keyboard navigation: Tab funciona
- [ ] Screen readers: labels, roles correctos
- [ ] Focus visible: outline visible en buttons
- [ ] Color contrast: texto legible
- [ ] `prefers-reduced-motion`: animaciones se pueden deshabilitar

---

## ✅ Checklist Final

Antes de marcar como "Completado":

- [ ] Probado en mobile real o emulador
- [ ] Probado en tablet real o emulador
- [ ] Probado en desktop (1024px+)
- [ ] Probado en navegadores: Chrome, Firefox, Safari
- [ ] Probado con DevTools en orientación portrait y landscape
- [ ] NO hay console errors
- [ ] Build exitoso sin warnings
- [ ] Vercel deploy completado

---

**¡Sistema listo para producción!** 🎉

