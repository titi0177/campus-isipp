import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export const Route = createFileRoute('/professor/subjects')({
  component: ProfessorSubjectsPage,
})

function ProfessorSubjectsPage() {
  const [rows, setRows] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    void load()
  }, [])

  async function load() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setRows([])
      setLoading(false)
      return
    }
    const { data: prof } = await supabase
      .from('professors')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle()

    if (!prof?.id) {
      setRows([])
      setLoading(false)
      return
    }

    const { data } = await supabase
      .from('subjects')
      .select('*, program:programs(name)')
      .eq('professor_id', prof.id)
      .order('name')

    setRows(data ?? [])
    setLoading(false)
  }

  if (loading) {
    return <p className="text-slate-600">Cargando…</p>
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Mis asignaturas</h1>
      <div className="card overflow-hidden p-0">
        <table className="w-full text-sm">
          <thead>
            <tr className="table-header">
              <th className="px-4 py-2 text-left">Código</th>
              <th className="px-4 py-2 text-left">Nombre</th>
              <th className="px-4 py-2 text-left">Programa</th>
              <th className="px-4 py-2 text-left">Año</th>
              <th className="px-4 py-2 text-left">Créditos</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((s) => (
              <tr key={s.id} className="border-b border-slate-100">
                <td className="px-4 py-2 font-mono text-xs">{s.code}</td>
                <td className="px-4 py-2">{s.name}</td>
                <td className="px-4 py-2 text-slate-600">{s.program?.name ?? '—'}</td>
                <td className="px-4 py-2">{s.year}</td>
                <td className="px-4 py-2">{s.credits}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && (
          <p className="p-6 text-slate-600">No tenés asignaturas asignadas.</p>
        )}
      </div>
    </div>
  )
}
