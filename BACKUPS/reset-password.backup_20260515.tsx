import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export const Route = createFileRoute('/reset-password')({
  component: ResetPasswordPage,
})

function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirm) { setError('Las contraseñas no coinciden.'); return }
    setLoading(true)
    const { error: err } = await supabase.auth.updateUser({ password })
    if (err) setError('No se pudo actualizar la contraseña. Intente nuevamente.')
    else setDone(true)
    setLoading(false)
  }

  return (
    <div className="siu-login-page flex items-center justify-center p-4">
      <div className="siu-login-card w-full max-w-md bg-white">
        <div className="siu-login-banner py-5">
          <div className="siu-login-logo-wrap max-w-[200px] py-3">
            <img
              src="/logo-isipp.png"
              alt=""
              className="siu-login-logo max-h-[72px]"
              width={200}
              height={100}
            />
          </div>
          <h1 className="text-base font-bold">Nueva contraseña</h1>
          <p className="mt-1 text-xs text-white/85">Instituto Superior de Informática Puerto Piray</p>
        </div>
        <div className="p-8">
          {done ? (
            <div className="text-center">
              <p className="mb-4 font-semibold text-emerald-700">Contraseña actualizada correctamente.</p>
              <a href="/login" className="btn-primary inline-block px-6">Ir al inicio de sesión</a>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800" style={{ borderRadius: '2px' }}>
                  {error}
                </div>
              )}
              <div>
                <label className="form-label" htmlFor="np">Nueva contraseña</label>
                <input
                  id="np"
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  className="form-input"
                  placeholder="••••••••"
                />
              </div>
              <div>
                <label className="form-label" htmlFor="npc">Confirmar</label>
                <input
                  id="npc"
                  type="password"
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  required
                  className="form-input"
                  placeholder="••••••••"
                />
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full py-3 font-bold">
                {loading ? 'Guardando…' : 'Guardar contraseña'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
