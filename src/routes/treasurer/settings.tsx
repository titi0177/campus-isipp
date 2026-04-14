import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/components/Toast'
import { Lock, Check, AlertCircle } from 'lucide-react'

export const Route = createFileRoute('/treasurer/settings')({
  component: TreasurerSettings,
})

function TreasurerSettings() {
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordChanged, setPasswordChanged] = useState(false)
  const { showToast } = useToast()

  useEffect(() => {
    async function loadUserEmail() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          setEmail(user.email || '')
        }
      } catch (err) {
        console.error('Error loading user:', err)
      }
    }
    void loadUserEmail()
  }, [])

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!currentPassword || !newPassword || !confirmPassword) {
      showToast('Por favor completa todos los campos', 'error')
      return
    }

    if (newPassword !== confirmPassword) {
      showToast('Las contraseñas nuevas no coinciden', 'error')
      return
    }

    if (newPassword.length < 6) {
      showToast('La contraseña debe tener al menos 6 caracteres', 'error')
      return
    }

    setLoading(true)
    try {
      // Primero verificar que la contraseña actual es correcta
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No estás autenticado')

      // Intentar actualizar la contraseña
      const { error } = await supabase.auth.updateUser({ password: newPassword })

      if (error) {
        // Si es error de contraseña incorrecta
        if (error.message.includes('current password') || error.message.includes('Incorrect password')) {
          showToast('Contraseña actual incorrecta', 'error')
        } else {
          showToast(`Error: ${error.message}`, 'error')
        }
        return
      }

      setPasswordChanged(true)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      showToast('¡Contraseña actualizada correctamente!', 'success')

      // Limpiar mensaje después de 3 segundos
      setTimeout(() => setPasswordChanged(false), 3000)
    } catch (err: any) {
      console.error('Error:', err)
      showToast(err.message || 'Error al cambiar la contraseña', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Lock size={28} />
          Seguridad y Contraseña
        </h1>
        <p className="text-slate-600 text-sm mt-1">Gestiona tu contraseña y configuración de seguridad</p>
      </div>

      {/* Success Message */}
      {passwordChanged && (
        <div className="card p-4 bg-green-50 border border-green-200 flex items-start gap-3">
          <Check size={20} className="text-green-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-green-900">¡Éxito!</h3>
            <p className="text-sm text-green-700">Tu contraseña ha sido actualizada correctamente.</p>
          </div>
        </div>
      )}

      {/* Email Information Card */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Información de Cuenta</h2>
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium text-slate-600">Email</label>
            <p className="text-slate-900 font-medium mt-1">{email || 'Cargando...'}</p>
          </div>
        </div>
      </div>

      {/* Change Password Form */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Cambiar Contraseña</h2>
        
        <form onSubmit={handleChangePassword} className="space-y-4">
          {/* Warning */}
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded flex items-start gap-2">
            <AlertCircle size={18} className="text-yellow-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-yellow-700">
              Tu contraseña debe tener al menos 6 caracteres.
            </p>
          </div>

          {/* Current Password */}
          <div>
            <label htmlFor="current-password" className="form-label">
              Contraseña actual *
            </label>
            <input
              id="current-password"
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="form-input"
              placeholder="Ingresa tu contraseña actual"
            />
            <p className="text-xs text-slate-500 mt-1">
              Necesitamos verificar tu identidad antes de cambiar la contraseña
            </p>
          </div>

          {/* New Password */}
          <div>
            <label htmlFor="new-password" className="form-label">
              Contraseña nueva *
            </label>
            <input
              id="new-password"
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="form-input"
              placeholder="Ingresa tu nueva contraseña"
            />
          </div>

          {/* Confirm Password */}
          <div>
            <label htmlFor="confirm-password" className="form-label">
              Confirmar contraseña *
            </label>
            <input
              id="confirm-password"
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="form-input"
              placeholder="Confirma tu nueva contraseña"
            />
            {newPassword && confirmPassword && newPassword === confirmPassword && (
              <p className="text-xs text-green-600 mt-1">✓ Las contraseñas coinciden</p>
            )}
            {newPassword && confirmPassword && newPassword !== confirmPassword && (
              <p className="text-xs text-red-600 mt-1">✗ Las contraseñas no coinciden</p>
            )}
          </div>

          {/* Submit Button */}
          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="btn-primary flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                  Actualizando...
                </>
              ) : (
                <>
                  <Lock size={16} />
                  Cambiar contraseña
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Security Tips */}
      <div className="card p-6 bg-blue-50 border border-blue-200">
        <h2 className="text-lg font-semibold text-blue-900 mb-3">Consejos de Seguridad</h2>
        <ul className="space-y-2 text-sm text-blue-800">
          <li className="flex gap-2">
            <span className="font-bold">•</span>
            <span>Usa una contraseña única y no la compartas con nadie</span>
          </li>
          <li className="flex gap-2">
            <span className="font-bold">•</span>
            <span>Cambia tu contraseña regularmente (al menos cada 90 días)</span>
          </li>
          <li className="flex gap-2">
            <span className="font-bold">•</span>
            <span>No uses información personal como fechas o nombres</span>
          </li>
          <li className="flex gap-2">
            <span className="font-bold">•</span>
            <span>Cierra sesión cuando termines de usar el sistema</span>
          </li>
        </ul>
      </div>
    </div>
  )
}