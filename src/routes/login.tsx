import { createFileRoute, redirect } from '@tanstack/react-router'
import { useState } from 'react'
import { GraduationCap, Eye, EyeOff, Lock, Mail } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useNavigate } from '@tanstack/react-router'

export const Route = createFileRoute('/login')({
  beforeLoad: async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) throw redirect({ to: '/' })
  },
  component: LoginPage,
})

function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [forgotMode, setForgotMode] = useState(false)
  const [resetSent, setResetSent] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error: err } = await supabase.auth.signInWithPassword({ email, password })
    if (err) {
      setError('Credenciales inválidas. Verifique su email y contraseña.')
      setLoading(false)
      return
    }
    navigate({ to: '/' })
  }

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    setResetSent(true)
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#4A0F18] via-[#7A1E2C] to-[#9B2535] flex items-center justify-center p-4">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
          backgroundSize: '40px 40px'
        }} />
      </div>

      <div className="relative w-full max-w-md">
        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-[#7A1E2C] px-8 py-8 text-center">
            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4">
              <GraduationCap size={32} className="text-[#7A1E2C]" />
            </div>
            <h1 className="text-2xl font-bold text-white">ISIPP</h1>
            <p className="text-white/80 text-sm mt-1">Instituto Superior ISIPP</p>
            <p className="text-white/60 text-xs mt-2">Sistema de Gestión Académica</p>
          </div>

          {/* Form */}
          <div className="px-8 py-8">
            {!forgotMode ? (
              <>
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Iniciar Sesión</h2>
                {error && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                    {error}
                  </div>
                )}
                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <label className="form-label">Correo Electrónico</label>
                    <div className="relative">
                      <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        required
                        className="form-input pl-9"
                        placeholder="usuario@isipp.edu.ar"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="form-label">Contraseña</label>
                    <div className="relative">
                      <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type={showPass ? 'text' : 'password'}
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        required
                        className="form-input pl-9 pr-10"
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPass(!showPass)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary w-full py-3 font-semibold disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Ingresando...' : 'Ingresar al Sistema'}
                  </button>
                </form>
                <button
                  onClick={() => setForgotMode(true)}
                  className="mt-4 text-sm text-[#7A1E2C] hover:underline w-full text-center"
                >
                  ¿Olvidó su contraseña?
                </button>
              </>
            ) : (
              <>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Recuperar Contraseña</h2>
                <p className="text-sm text-gray-500 mb-6">Ingrese su email para recibir instrucciones.</p>
                {resetSent ? (
                  <div className="p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm text-center">
                    ✓ Se envió un email con instrucciones para recuperar su contraseña.
                  </div>
                ) : (
                  <form onSubmit={handleReset} className="space-y-4">
                    <div>
                      <label className="form-label">Correo Electrónico</label>
                      <input
                        type="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        required
                        className="form-input"
                        placeholder="usuario@isipp.edu.ar"
                      />
                    </div>
                    <button type="submit" disabled={loading} className="btn-primary w-full py-3">
                      {loading ? 'Enviando...' : 'Enviar Instrucciones'}
                    </button>
                  </form>
                )}
                <button
                  onClick={() => { setForgotMode(false); setResetSent(false) }}
                  className="mt-4 text-sm text-gray-500 hover:underline w-full text-center"
                >
                  ← Volver al inicio de sesión
                </button>
              </>
            )}
          </div>
        </div>

        <p className="text-center text-white/50 text-xs mt-6">
          © 2025 Instituto Superior ISIPP — Sistema Académico v1.0
        </p>
      </div>
    </div>
  )
}
