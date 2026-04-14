// Logo del Instituto Superior de Informática - SVG
export function InstituteLogo() {
  return (
    <svg
      viewBox="0 0 200 180"
      xmlns="http://www.w3.org/2000/svg"
      width="120"
      height="108"
    >
      {/* Fondo blanco */}
      <rect width="200" height="180" fill="white" />

      {/* Techo (triángulo) */}
      <polygon
        points="100,20 30,80 170,80"
        fill="none"
        stroke="#582C31"
        strokeWidth="3"
      />

      {/* Decoración del techo */}
      <line x1="100" y1="20" x2="100" y2="50" stroke="#582C31" strokeWidth="2" />
      <circle cx="100" cy="25" r="4" fill="#582C31" />

      {/* Base del techo */}
      <line x1="30" y1="80" x2="170" y2="80" stroke="#582C31" strokeWidth="3" />

      {/* Columnas (4 columnas) */}
      {/* Columna 1 */}
      <rect x="45" y="80" width="12" height="70" fill="none" stroke="#582C31" strokeWidth="2.5" />
      <line x1="45" y1="95" x2="57" y2="95" stroke="#582C31" strokeWidth="1" />
      <line x1="45" y1="110" x2="57" y2="110" stroke="#582C31" strokeWidth="1" />
      <line x1="45" y1="125" x2="57" y2="125" stroke="#582C31" strokeWidth="1" />

      {/* Columna 2 */}
      <rect x="69" y="80" width="12" height="70" fill="none" stroke="#582C31" strokeWidth="2.5" />
      <line x1="69" y1="95" x2="81" y2="95" stroke="#582C31" strokeWidth="1" />
      <line x1="69" y1="110" x2="81" y2="110" stroke="#582C31" strokeWidth="1" />
      <line x1="69" y1="125" x2="81" y2="125" stroke="#582C31" strokeWidth="1" />

      {/* Columna 3 */}
      <rect x="119" y="80" width="12" height="70" fill="none" stroke="#582C31" strokeWidth="2.5" />
      <line x1="119" y1="95" x2="131" y2="95" stroke="#582C31" strokeWidth="1" />
      <line x1="119" y1="110" x2="131" y2="110" stroke="#582C31" strokeWidth="1" />
      <line x1="119" y1="125" x2="131" y2="125" stroke="#582C31" strokeWidth="1" />

      {/* Columna 4 */}
      <rect x="143" y="80" width="12" height="70" fill="none" stroke="#582C31" strokeWidth="2.5" />
      <line x1="143" y1="95" x2="155" y2="95" stroke="#582C31" strokeWidth="1" />
      <line x1="143" y1="110" x2="155" y2="110" stroke="#582C31" strokeWidth="1" />
      <line x1="143" y1="125" x2="155" y2="125" stroke="#582C31" strokeWidth="1" />

      {/* Base/Plataforma */}
      <rect x="30" y="150" width="140" height="8" fill="none" stroke="#582C31" strokeWidth="2.5" />
      <line x1="30" y1="158" x2="170" y2="158" stroke="#582C31" strokeWidth="2" />

      {/* Texto bajo el logo */}
      <text
        x="100"
        y="175"
        textAnchor="middle"
        fontSize="10"
        fontFamily="Arial, sans-serif"
        fontWeight="bold"
        fill="#582C31"
      >
        Instituto Superior
      </text>
    </svg>
  )
}

// Exportar también como Data URL para usar en jsPDF
export function getInstitueLogoDataUrl() {
  const svg = `<svg viewBox="0 0 200 180" xmlns="http://www.w3.org/2000/svg" width="120" height="108">
    <rect width="200" height="180" fill="white" />
    <polygon points="100,20 30,80 170,80" fill="none" stroke="#582C31" stroke-width="3" />
    <line x1="100" y1="20" x2="100" y2="50" stroke="#582C31" stroke-width="2" />
    <circle cx="100" cy="25" r="4" fill="#582C31" />
    <line x1="30" y1="80" x2="170" y2="80" stroke="#582C31" stroke-width="3" />
    <rect x="45" y="80" width="12" height="70" fill="none" stroke="#582C31" stroke-width="2.5" />
    <line x1="45" y1="95" x2="57" y2="95" stroke="#582C31" stroke-width="1" />
    <line x1="45" y1="110" x2="57" y2="110" stroke="#582C31" stroke-width="1" />
    <line x1="45" y1="125" x2="57" y2="125" stroke="#582C31" stroke-width="1" />
    <rect x="69" y="80" width="12" height="70" fill="none" stroke="#582C31" stroke-width="2.5" />
    <line x1="69" y1="95" x2="81" y2="95" stroke="#582C31" stroke-width="1" />
    <line x1="69" y1="110" x2="81" y2="110" stroke="#582C31" stroke-width="1" />
    <line x1="69" y1="125" x2="81" y2="125" stroke="#582C31" stroke-width="1" />
    <rect x="119" y="80" width="12" height="70" fill="none" stroke="#582C31" stroke-width="2.5" />
    <line x1="119" y1="95" x2="131" y2="95" stroke="#582C31" stroke-width="1" />
    <line x1="119" y1="110" x2="131" y2="110" stroke="#582C31" stroke-width="1" />
    <line x1="119" y1="125" x2="131" y2="125" stroke="#582C31" stroke-width="1" />
    <rect x="143" y="80" width="12" height="70" fill="none" stroke="#582C31" stroke-width="2.5" />
    <line x1="143" y1="95" x2="155" y2="95" stroke="#582C31" stroke-width="1" />
    <line x1="143" y1="110" x2="155" y2="110" stroke="#582C31" stroke-width="1" />
    <line x1="143" y1="125" x2="155" y2="125" stroke="#582C31" stroke-width="1" />
    <rect x="30" y="150" width="140" height="8" fill="none" stroke="#582C31" stroke-width="2.5" />
    <line x1="30" y1="158" x2="170" y2="158" stroke="#582C31" stroke-width="2" />
  </svg>`
  
  return 'data:image/svg+xml;base64,' + btoa(svg)
}
