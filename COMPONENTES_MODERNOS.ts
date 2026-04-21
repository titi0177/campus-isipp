// ============================================================================
// GUÍA DE USO - NUEVOS COMPONENTES MODERNOS
// ============================================================================

/*
COMPONENTES CREADOS:

1. ModernDataTable - Tabla ultra-moderna con características avanzadas
   - Búsqueda en tiempo real
   - Ordenamiento por columnas
   - Paginación mejorada
   - Iconos en encabezados
   - Efectos hover suave
   - Soporte para acciones personalizadas

2. TableCells - Componentes especializados para celdas
   - StatusBadgeModern: Badges con iconos y colores
   - AvatarCell: Avatares con iniciales
   - ContactCell: Información de contacto
   - ProgressCell: Barras de progreso
   - TagsCell: Etiquetas múltiples
   - ActionCell: Botones de acción
   - NumberCell: Números formateados
   - DateCell: Fechas localizadas
   - BadgeModern: Badges personalizables

3. ModernStatCard - Tarjetas de estadísticas premium
   - Iconos e identificación por color
   - Indicadores de tendencia (up/down)
   - Gradientes de fondo
   - Grid automático

4. ModernCard - Tarjetas versátiles modernas
   - 3 variantes: default, elevated, outlined
   - Headers personalizables
   - Acciones integradas
   - EmptyStateCard para estados vacíos
   - InfoBox para información contextual
   - Alert para alertas interactivas

============================================================================
EJEMPLOS DE USO
============================================================================
*/

// EJEMPLO 1: ModernDataTable básica
import { ModernDataTable } from '@/components/ModernDataTable'
import { Users, BookOpen } from 'lucide-react'

function StudentsList() {
  const students = [
    { id: 1, name: 'Juan Pérez', email: 'juan@isipp.edu.ar', status: 'active' },
    { id: 2, name: 'María García', email: 'maria@isipp.edu.ar', status: 'active' },
  ]

  return (
    <ModernDataTable
      title="Estudiantes del Sistema"
      subtitle="Gestión de alumnos inscritos"
      data={students}
      columns={[
        { key: 'name', label: 'Nombre', icon: <Users size={16} />, sortable: true },
        { key: 'email', label: 'Email', icon: <BookOpen size={16} /> },
      ]}
    />
  )
}

// EJEMPLO 2: ModernDataTable con celdas especializadas
import { AvatarCell, StatusBadgeModern, ActionCell } from '@/components/TableCells'

function AdvancedStudentsList() {
  const students = [
    {
      id: 1,
      name: 'Juan Pérez',
      email: 'juan@isipp.edu.ar',
      status: 'active', // 'active' | 'inactive' | 'pending'
    },
  ]

  return (
    <ModernDataTable
      title="Estudiantes"
      data={students}
      columns={[
        {
          key: 'name',
          label: 'Alumno',
          icon: <Users size={16} />,
          render: (row) => (
            <AvatarCell name={row.name} email={row.email} />
          ),
          width: '280px',
        },
        {
          key: 'status',
          label: 'Estado',
          render: (row) => {
            const statusMap = {
              active: { label: '✅ Activo', status: 'success' },
              inactive: { label: '❌ Inactivo', status: 'error' },
              pending: { label: '⏳ Pendiente', status: 'pending' },
            }
            const s = statusMap[row.status]
            return <StatusBadgeModern status={s.status} label={s.label} />
          },
          sortable: true,
        },
      ]}
      actions={(row) => (
        <ActionCell
          onView={() => console.log('Ver:', row)}
          onEdit={() => console.log('Editar:', row)}
          onDelete={() => console.log('Eliminar:', row)}
        />
      )}
    />
  )
}

// EJEMPLO 3: ModernStatCard con grid
import { ModernStatCard, ModernStatGrid } from '@/components/ModernStatCard'
import { Users, BookOpen, DollarSign, TrendingUp } from 'lucide-react'

function DashboardStats() {
  return (
    <ModernStatGrid
      columns={4}
      stats={[
        {
          icon: <Users size={24} />,
          title: 'Total Estudiantes',
          value: 1243,
          color: 'blue',
          subtitle: 'Activos este período',
          trend: 'up',
          trendValue: '+12%',
        },
        {
          icon: <BookOpen size={24} />,
          title: 'Asignaturas',
          value: 48,
          color: 'green',
          subtitle: 'En oferta académica',
        },
        {
          icon: <DollarSign size={24} />,
          title: 'Ingresos Totales',
          value: '$145,890',
          color: 'purple',
          trend: 'up',
          trendValue: '+8.2%',
        },
      ]}
    />
  )
}

// EJEMPLO 4: ModernCard versátiles
import { ModernCard, EmptyStateCard, InfoBox, Alert } from '@/components/ModernCard'

function CardExamples() {
  return (
    <div className="space-y-6">
      {/* Tarjeta default */}
      <ModernCard
        title="Información del Programa"
        subtitle="Técnico en Informática"
        icon={<BookOpen size={20} />}
      >
        <p>Contenido de la tarjeta aquí</p>
      </ModernCard>

      {/* Tarjeta elevated */}
      <ModernCard
        variant="elevated"
        title="Tarjeta Destacada"
      >
        <p>Esta tarjeta tiene más sombra</p>
      </ModernCard>

      {/* Empty state */}
      <EmptyStateCard
        icon="📚"
        title="Sin Materiales"
        subtitle="No hay materiales disponibles aún"
        action={{
          label: 'Agregar Material',
          onClick: () => console.log('Agregar'),
        }}
      />

      {/* Info box */}
      <InfoBox
        type="info"
        title="Información"
        content="Este es un mensaje informativo"
      />

      {/* Alert */}
      <Alert
        type="success"
        title="¡Éxito!"
        message="Los cambios se guardaron correctamente"
        onClose={() => console.log('Cerrado')}
      />
    </div>
  )
}

// EJEMPLO 5: Más celdas especializadas
import {
  ContactCell,
  ProgressCell,
  TagsCell,
  NumberCell,
  DateCell,
} from '@/components/TableCells'

function AdvancedCellsExample() {
  return (
    <ModernDataTable
      title="Información Detallada"
      data={[
        {
          student: 'Juan Pérez',
          email: 'juan@isipp.edu.ar',
          phone: '0376-123456',
          progress: 75,
          skills: ['React', 'TypeScript', 'Node.js'],
          gpa: 8.5,
          enrollment_date: '2023-01-15',
        },
      ]}
      columns={[
        {
          key: 'student',
          label: 'Estudiante',
          render: (row) => (
            <AvatarCell name={row.student} email={row.email} />
          ),
        },
        {
          key: 'contact',
          label: 'Contacto',
          render: (row) => (
            <ContactCell email={row.email} phone={row.phone} />
          ),
        },
        {
          key: 'progress',
          label: 'Progreso',
          render: (row) => (
            <ProgressCell value={row.progress} max={100} />
          ),
        },
        {
          key: 'skills',
          label: 'Habilidades',
          render: (row) => (
            <TagsCell tags={row.skills} />
          ),
        },
        {
          key: 'gpa',
          label: 'Promedio',
          render: (row) => (
            <NumberCell value={row.gpa} format="number" />
          ),
        },
        {
          key: 'enrollment_date',
          label: 'Inscripción',
          render: (row) => (
            <DateCell date={row.enrollment_date} />
          ),
        },
      ]}
    />
  )
}

// PERSONALIZACIÓN DE COLORES

// ModernStatCard - Colores disponibles:
// 'blue' | 'green' | 'red' | 'purple' | 'orange' | 'pink'

// StatusBadgeModern - Estados disponibles:
// 'success' | 'error' | 'pending' | 'warning'

// BadgeModern - Colores disponibles:
// 'blue' | 'green' | 'red' | 'yellow' | 'purple'

// Ejemplos CSS nuevos disponibles en styles-enhancements.css:
// - .badge-base: Base para badges
// - .badge-promoted: Verde (aprobado)
// - .badge-regular: Azul (regular)
// - .badge-inprogress: Naranja (en progreso)
// - .badge-free: Púrpura (libre)
// - .badge-failed: Rojo (reprobado)
// - .badge-passed: Verde (aprobado)
// - .badge-warning: Amarillo (advertencia)
// - .badge-info: Azul (información)

// - .card-premium: Tarjeta con efectos premium
// - .truncate-1, .truncate-2, .truncate-3: Truncamiento de texto

/*
============================================================================
FEATURES CLAVE:
============================================================================

✨ TABLAS MODERNAS:
  ✓ Búsqueda en tiempo real filtrada
  ✓ Ordenamiento por columnas (sortable)
  ✓ Paginación inteligente
  ✓ Iconos en encabezados
  ✓ Efectos hover suave y elegante
  ✓ Acciones contextuales ocultas/mostradas
  ✓ Mensajes de estado vacío con emoji
  ✓ Soporta renderización personalizada

✨ CELDAS ESPECIALIZADAS:
  ✓ Avatares con iniciales generadas
  ✓ Badges de estado con iconos
  ✓ Contactos con enlaces (mail/tel)
  ✓ Barras de progreso coloreadas
  ✓ Etiquetas con limite de visualización
  ✓ Botones de acción (ver/editar/eliminar)
  ✓ Números formateados (divisas, %)
  ✓ Fechas localizadas
  ✓ Badges personalizables

✨ ESTADÍSTICAS PREMIUM:
  ✓ Gradientes de fondo
  ✓ Tendencias (up/down)
  ✓ Iconos coloreados
  ✓ Grid automático responsive
  ✓ Hover effects con elevación
  ✓ 6 colores predefinidos

✨ TARJETAS VERSÁTILES:
  ✓ 3 variantes de estilo
  ✓ Headers con títulos y subítulos
  ✓ Acciones integradas
  ✓ Empty states prediseñados
  ✓ Info boxes contextuales
  ✓ Alertas interactivas
  ✓ Efectos shine en hover

✨ DISEÑO RESPONSIVO:
  ✓ Mobile first
  ✓ Grid adaptable
  ✓ Touch targets (44x44px mínimo)
  ✓ Breakpoints medios, tablet, desktop
  ✓ Scrolling suave

✨ COLORES INSTITUCIONALES:
  ✓ Paleta Bordó ISIPP
  ✓ Gradientes premium
  ✓ Contraste WCAG AA
  ✓ Transiciones suave

============================================================================
NOTAS IMPORTANTES:
============================================================================

- Todos los componentes usan TypeScript
- Compatible con Lucide React para iconos
- Responsive por defecto
- Accesibilidad WCAG AA
- Transiciones y animaciones suaves
- Sin breaking changes en código existente

*/

export default {}
