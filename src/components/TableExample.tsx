import { Users, BookOpen, Calendar, Star, DollarSign } from 'lucide-react'
import { ModernDataTable } from './ModernDataTable'
import { AvatarCell, StatusBadgeModern, ActionCell, TagsCell, ProgressCell, DateCell, NumberCell } from './TableCells'

// Example component showing how to use ModernDataTable
export function TableExample() {
  // Sample data
  const studentData = [
    {
      id: 1,
      name: 'Juan Pérez',
      email: 'juan.perez@isipp.edu.ar',
      program: 'Técnico en Informática',
      status: 'active',
      progress: 75,
      enrolled_subjects: 5,
      gpa: 8.5,
      admission_date: '2023-01-15',
    },
    {
      id: 2,
      name: 'María García',
      email: 'maria.garcia@isipp.edu.ar',
      program: 'Licenciatura en Sistemas',
      status: 'active',
      progress: 92,
      enrolled_subjects: 6,
      gpa: 9.2,
      admission_date: '2022-08-20',
    },
    {
      id: 3,
      name: 'Carlos López',
      email: 'carlos.lopez@isipp.edu.ar',
      program: 'Técnico en Informática',
      status: 'inactive',
      progress: 45,
      enrolled_subjects: 3,
      gpa: 7.1,
      admission_date: '2023-03-10',
    },
    {
      id: 4,
      name: 'Ana Martínez',
      email: 'ana.martinez@isipp.edu.ar',
      program: 'Licenciatura en Sistemas',
      status: 'active',
      progress: 88,
      enrolled_subjects: 5,
      gpa: 8.8,
      admission_date: '2022-09-01',
    },
    {
      id: 5,
      name: 'Roberto Fernández',
      email: 'roberto.fernandez@isipp.edu.ar',
      program: 'Diplomatura en Redes',
      status: 'pending',
      progress: 20,
      enrolled_subjects: 2,
      gpa: 6.5,
      admission_date: '2024-01-05',
    },
  ]

  const statusMap = {
    active: { label: '✅ Activo', status: 'success' as const },
    inactive: { label: '❌ Inactivo', status: 'error' as const },
    pending: { label: '⏳ Pendiente', status: 'pending' as const },
  }

  return (
    <div className="space-y-6">
      {/* Students Table */}
      <ModernDataTable
        title="Estudiantes Inscritos"
        subtitle="Gestión integral del alumnado del instituto"
        data={studentData}
        pageSize={5}
        columns={[
          {
            key: 'name',
            label: 'Alumno',
            icon: <Users size={16} />,
            render: (row) => (
              <AvatarCell
                name={row.name as string}
                email={row.email as string}
              />
            ),
            width: '280px',
          },
          {
            key: 'program',
            label: 'Programa',
            icon: <BookOpen size={16} />,
            render: (row) => (
              <span className="font-medium text-slate-900">{row.program}</span>
            ),
            sortable: true,
          },
          {
            key: 'status',
            label: 'Estado',
            icon: <Star size={16} />,
            render: (row) => {
              const status = statusMap[row.status as 'active' | 'inactive' | 'pending']
              return <StatusBadgeModern status={status.status} label={status.label} />
            },
            sortable: true,
          },
          {
            key: 'progress',
            label: 'Progreso',
            icon: <Calendar size={16} />,
            render: (row) => <ProgressCell value={row.progress as number} max={100} />,
            width: '180px',
          },
          {
            key: 'gpa',
            label: 'Promedio',
            icon: <Star size={16} />,
            render: (row) => (
              <span className="font-bold text-[var(--isipp-bordo)]">{row.gpa}/10</span>
            ),
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

      {/* Programs Table */}
      <ModernDataTable
        title="Propuestas Formativas"
        subtitle="Catálogo de programas educativos disponibles"
        data={[
          {
            id: 1,
            name: 'Técnico en Informática',
            duration: '2 años',
            students: 45,
            subjects: 12,
            status: 'active',
            tags: ['Frontend', 'Backend', 'Bases de Datos'],
          },
          {
            id: 2,
            name: 'Licenciatura en Sistemas',
            duration: '4 años',
            students: 28,
            subjects: 18,
            status: 'active',
            tags: ['Arquitectura', 'Seguridad', 'Cloud'],
          },
          {
            id: 3,
            name: 'Diplomatura en Redes',
            duration: '1.5 años',
            students: 32,
            subjects: 8,
            status: 'active',
            tags: ['Networking', 'Administración', 'Linux'],
          },
        ]}
        columns={[
          {
            key: 'name',
            label: 'Programa',
            icon: <BookOpen size={16} />,
            sortable: true,
          },
          {
            key: 'duration',
            label: 'Duración',
            icon: <Calendar size={16} />,
          },
          {
            key: 'students',
            label: 'Estudiantes',
            icon: <Users size={16} />,
            render: (row) => <NumberCell value={row.students as number} />,
            sortable: true,
          },
          {
            key: 'subjects',
            label: 'Asignaturas',
            icon: <BookOpen size={16} />,
            render: (row) => <NumberCell value={row.subjects as number} />,
          },
          {
            key: 'tags',
            label: 'Tecnologías',
            render: (row) => <TagsCell tags={row.tags as string[]} />,
          },
        ]}
        actions={(row) => (
          <ActionCell
            onEdit={() => console.log('Editar:', row)}
            onDelete={() => console.log('Eliminar:', row)}
          />
        )}
      />
    </div>
  )
}

export default TableExample
