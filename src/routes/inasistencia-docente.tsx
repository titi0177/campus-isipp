import { createFileRoute, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/inasistencia-docente')({
  component: InasistenciaDocenteLayout,
})

function InasistenciaDocenteLayout() {
  return <Outlet />
}
