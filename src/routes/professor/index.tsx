import { createFileRoute, Link } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { BookOpen, Star, ClipboardCheck, Users, MessageCircle } from 'lucide-react'
import { StatCard } from '@/components/StatCard'

export const Route = createFileRoute('/professor/')({
  component: ProfessorHome,
})

function ProfessorHome() {
  const [professorId, setProfessorId] = useState<string | null>(null)
  const [professorName, setProfessorName] = useState<string>('')
  const [subjectCount, setSubjectCount] = useState(0)
  const [enrollmentCount, setEnrollmentCount] = useState(0)

  useEffect(() => {
    void load()
  }, [])

  async function load() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: prof } = await supabase
      .from('professors')
      .select('id, name')
      .eq('user_id', user.id)
      .maybeSingle()

    if (!prof?.id) {
      setProfessorId(null)
      return
    }

    setProfessorId(prof.id)
    setProfessorName(prof.name || '')

    const { data: subjects } = await supabase
      .from('subjects')
      .select('id')
      .eq('professor_id', prof.id)

    const ids = subjects?.map((s) => s.id) ?? []
    setSubjectCount(ids.length)

    if (ids.length === 0) {
      setEnrollmentCount(0)
      return
    }

    const { count } = await supabase
      .from('enrollments')
      .select('id', { count: 'exact', head: true })
      .in('subject_id', ids)

    setEnrollmentCount(count ?? 0)
  }

  if (!professorId) {
    return (
      <div className="card space-y-4 p-6">
        <h1 className="text-2xl font-bold">Portal docente</h1>
        <p className="text-slate-600">
          Tu usuario aún no está vinculado a un registro de docente. Un administrador debe asignar tu <strong>user_id</strong> en la tabla <code className="rounded bg-slate-100 px-1">professors</code>, o vincular el docente desde administración.
        </p>
        <Link to="/dashboard" className="btn-primary inline-block w-fit">
          Volver al inicio
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Bienvenido, {professorName}</h1>
        <p className="mt-1 text-slate-600">Resumen de tus asignaturas a cargo</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard title="Asignaturas" value={subjectCount} icon={BookOpen} />
        <StatCard title="Inscriptos (total)" value={enrollmentCount} icon={Users} />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Link to="/professor/subjects" className="card siu-hover-card flex items-center gap-3 p-4">
          <BookOpen className="h-8 w-8 text-[var(--siu-burgundy)]" />
          <div>
            <div className="font-semibold">Mis asignaturas</div>
            <div className="text-sm text-slate-500">Listado y detalle</div>
          </div>
        </Link>
        <Link to="/professor/grades" className="card siu-hover-card flex items-center gap-3 p-4">
          <Star className="h-8 w-8 text-[var(--siu-burgundy)]" />
          <div>
            <div className="font-semibold">Calificaciones</div>
            <div className="text-sm text-slate-500">Carga de notas</div>
          </div>
        </Link>
        <Link to="/professor/attendance" className="card siu-hover-card flex items-center gap-3 p-4">
          <ClipboardCheck className="h-8 w-8 text-[var(--siu-burgundy)]" />
          <div>
            <div className="font-semibold">Asistencia</div>
            <div className="text-sm text-slate-500">Por cursada</div>
          </div>
        </Link>
        <Link to="/professor/messages" className="card siu-hover-card flex items-center gap-3 p-4">
          <MessageCircle className="h-8 w-8 text-[var(--siu-burgundy)]" />
          <div>
            <div className="font-semibold">Mensajes</div>
            <div className="text-sm text-slate-500">Chatear con estudiantes</div>
          </div>
        </Link>
      </div>
    </div>
  )
}
