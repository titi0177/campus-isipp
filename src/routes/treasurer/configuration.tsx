import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/components/Toast'
import { Modal } from '@/components/Modal'
import { Settings, Pencil, Plus, AlertCircle } from 'lucide-react'

export const Route = createFileRoute('/treasurer/configuration')({
  component: PaymentConfiguration,
})

type Program = {
  id: string
  name: string
}

type PaymentConfig = {
  id: string
  program_id: string
  program_name: string
  insurance_amount: number
  enrollment_amount: number
  monthly_quota_amount: number
  increment_percentage: number
  increment_day: number
}

type FormData = {
  insurance_amount: number
  enrollment_amount: number
  monthly_quota_amount: number
  increment_percentage: number
  increment_day: number
}

function PaymentConfiguration() {
  const [programs, setPrograms] = useState<Program[]>([])
  const [configs, setConfigs] = useState<PaymentConfig[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingConfig, setEditingConfig] = useState<PaymentConfig | null>(null)
  const [selectedProgram, setSelectedProgram] = useState<string>('')
  const [formData, setFormData] = useState<FormData>({
    insurance_amount: 2000,
    enrollment_amount: 15000,
    monthly_quota_amount: 5000,
    increment_percentage: 15,
    increment_day: 10,
  })
  const { showToast } = useToast()

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      setLoading(true)

      // Cargar programas
      const { data: progs, error: progsError } = await supabase
        .from('programs')
        .select('id, name')
        .order('name')

      if (progsError) {
        console.error('Error loading programs:', progsError)
        showToast('Error cargando carreras', 'error')
        setPrograms([])
      } else {
        setPrograms(progs || [])
      }

      // Cargar configuraciones
      const { data: cfgs, error: cfgsError } = await supabase
        .from('payment_configuration')
        .select('id, program_id, program_name, insurance_amount, enrollment_amount, monthly_quota_amount, increment_percentage, increment_day')
        .order('program_name')

      if (cfgsError) {
        console.error('Error loading configurations:', cfgsError)
        console.log('Esto es normal si la tabla aún no existe. Ejecuta la migration SQL primero.')
        showToast('⚠️ Ejecuta la migration SQL primero en Supabase', 'error')
        setConfigs([])
      } else {
        setConfigs(cfgs || [])
      }

      setLoading(false)
    } catch (err) {
      console.error('Unexpected error:', err)
      showToast('Error inesperado', 'error')
      setLoading(false)
    }
  }

  const openNewConfig = () => {
    setSelectedProgram('')
    setFormData({
      insurance_amount: 2000,
      enrollment_amount: 15000,
      monthly_quota_amount: 5000,
      increment_percentage: 15,
      increment_day: 10,
    })
    setEditingConfig(null)
    setModalOpen(true)
  }

  const openEditConfig = (config: PaymentConfig) => {
    setEditingConfig(config)
    setSelectedProgram(config.program_id)
    setFormData({
      insurance_amount: config.insurance_amount,
      enrollment_amount: config.enrollment_amount,
      monthly_quota_amount: config.monthly_quota_amount,
      increment_percentage: config.increment_percentage,
      increment_day: config.increment_day,
    })
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setEditingConfig(null)
    setSelectedProgram('')
  }

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    if (!selectedProgram) {
      showToast('Selecciona una carrera', 'error')
      setSaving(false)
      return
    }

    try {
      const program = programs.find(p => p.id === selectedProgram)
      if (!program) {
        showToast('Carrera no válida', 'error')
        setSaving(false)
        return
      }

      // Obtener usuario actual
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        showToast('Error de autenticación', 'error')
        setSaving(false)
        return
      }

      const payloadData = {
        insurance_amount: formData.insurance_amount,
        enrollment_amount: formData.enrollment_amount,
        monthly_quota_amount: formData.monthly_quota_amount,
        increment_percentage: formData.increment_percentage,
        increment_day: 10,
      }

      if (editingConfig) {
        const updatePayload = {
          ...payloadData,
          updated_at: new Date().toISOString(),
          updated_by: user.id,
        }

        const { error } = await supabase
          .from('payment_configuration')
          .update(updatePayload)
          .eq('id', editingConfig.id)

        if (error) {
          console.error('Error updating config:', error)
          showToast(`Error al actualizar: ${error.message}`, 'error')
          setSaving(false)
          return
        }

        showToast('✓ Configuración actualizada')
      } else {
        const insertPayload = {
          program_id: selectedProgram,
          program_name: program.name,
          ...payloadData,
          created_by: user.id,
        }

        const { error } = await supabase
          .from('payment_configuration')
          .insert([insertPayload])

        if (error) {
          console.error('Error creating config:', error)
          
          if (error.message.includes('permission denied')) {
            showToast('❌ Sin permisos. Verifica RLS en Supabase', 'error')
          } else if (error.message.includes('relation') || error.message.includes('does not exist')) {
            showToast('❌ Tabla no existe. Ejecuta la migration SQL en Supabase', 'error')
          } else if (error.message.includes('duplicate') || error.message.includes('Violates unique')) {
            showToast('❌ Esta carrera ya tiene configuración', 'error')
          } else {
            showToast(`❌ Error: ${error.message}`, 'error')
          }
          
          setSaving(false)
          return
        }

        showToast('✓ Configuración creada')
      }

      closeModal()
      setSaving(false)
      await loadData()
    } catch (err: any) {
      console.error('Error guardando:', err)
      showToast(`Error inesperado: ${err.message || 'Intenta de nuevo'}`, 'error')
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="mb-4 inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="text-slate-600">Cargando configuraciones...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Settings size={28} />
            Configuración de Montos por Carrera
          </h1>
          <p className="text-slate-600 text-sm mt-1">
            Define los montos de seguro, inscripción, cuotas e incremento por demora
          </p>
        </div>
        <button onClick={openNewConfig} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Nueva configuración
        </button>
      </div>

      <div className="card p-4 bg-blue-50 border border-blue-200 flex items-start gap-3">
        <AlertCircle size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-blue-700">
          <p className="font-semibold">ℹ️ Cómo funciona el cálculo de pagos:</p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>Se crea <strong>1 Seguro + 1 Inscripción + 9 Cuotas</strong> por estudiante (Abril a Diciembre)</li>
            <li><strong>Cuota base:</strong> Del 1 al 10 de cada mes se cobra el monto declarado aquí</li>
            <li><strong>Incremento por demora:</strong> Se aplica si se paga DESPUÉS del vencimiento Y después del primer día hábil a partir del 10</li>
            <li><strong>Ejemplo:</strong> Si el 10 de mayo es sábado, el primer día hábil es lunes 12. A partir del martes 13, si se paga tarde, se cobra el incremento</li>
          </ul>
        </div>
      </div>

      {configs.length === 0 ? (
        <div className="card p-8 text-center">
          <p className="text-slate-500 mb-4">No hay configuraciones creadas</p>
          <button onClick={openNewConfig} className="btn-primary">
            Crear primera configuración
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {configs.map(config => {
            return (
              <div key={config.id} className="card p-6 border-l-4 border-l-blue-500">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">{config.program_name}</h3>
                    <p className="text-sm text-slate-600 mt-1">
                      Incremento por demora: {config.increment_percentage}% (después del día 10)
                    </p>
                  </div>
                  <button
                    onClick={() => openEditConfig(config)}
                    className="p-2 hover:bg-blue-100 rounded text-blue-600"
                    title="Editar"
                  >
                    <Pencil size={18} />
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                  <div className="p-3 bg-slate-50 rounded">
                    <p className="text-xs font-semibold text-slate-600 uppercase">Seguro</p>
                    <p className="text-xl font-bold text-slate-900 mt-1">
                      ${config.insurance_amount.toFixed(2)}
                    </p>
                  </div>

                  <div className="p-3 bg-slate-50 rounded">
                    <p className="text-xs font-semibold text-slate-600 uppercase">Inscripción</p>
                    <p className="text-xl font-bold text-slate-900 mt-1">
                      ${config.enrollment_amount.toFixed(2)}
                    </p>
                  </div>

                  <div className="p-3 bg-green-50 rounded border border-green-200">
                    <p className="text-xs font-semibold text-green-600 uppercase">Cuota Base (1-10)</p>
                    <p className="text-xl font-bold text-green-900 mt-1">
                      ${config.monthly_quota_amount.toFixed(2)}
                    </p>
                  </div>

                  <div className="p-3 bg-orange-50 rounded border border-orange-200">
                    <p className="text-xs font-semibold text-orange-600 uppercase">Con Incremento</p>
                    <p className="text-xl font-bold text-orange-900 mt-1">
                      ${(config.monthly_quota_amount * (1 + config.increment_percentage / 100)).toFixed(2)}
                    </p>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs font-semibold text-slate-600 mb-1">Total anual (cuota base)</p>
                      <p className="text-2xl font-bold text-slate-900">
                        ${(config.insurance_amount + config.enrollment_amount + config.monthly_quota_amount * 9).toFixed(2)}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        (Seguro + Inscripción + 9 Cuotas)
                      </p>
                    </div>
                    <div className="bg-orange-50 p-3 rounded border border-orange-200">
                      <p className="text-xs font-semibold text-orange-600 mb-1">Total anual (con incremento en todas)</p>
                      <p className="text-2xl font-bold text-orange-900">
                        ${(config.insurance_amount + config.enrollment_amount + (config.monthly_quota_amount * 9 * (1 + config.increment_percentage / 100))).toFixed(2)}
                      </p>
                      <p className="text-xs text-orange-600 mt-1">
                        Caso máximo (si todas se pagan tarde)
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={editingConfig ? 'Editar configuración' : 'Nueva configuración'}
      >
        <form onSubmit={handleSaveConfig} className="space-y-4">
          {!editingConfig && (
            <div>
              <label className="form-label">Carrera *</label>
              <select
                required
                value={selectedProgram}
                onChange={e => setSelectedProgram(e.target.value)}
                className="form-input"
              >
                <option value="">Seleccionar carrera...</option>
                {programs.map(prog => (
                  <option key={prog.id} value={prog.id}>
                    {prog.name}
                  </option>
                ))}
              </select>
              {programs.length === 0 && (
                <p className="text-xs text-red-500 mt-1">⚠️ No hay carreras disponibles. Crea carreras primero.</p>
              )}
            </div>
          )}

          <div className="space-y-3">
            <h4 className="font-semibold text-slate-900">Montos</h4>

            <div>
              <label className="form-label">Seguro *</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600">$</span>
                <input
                  type="number"
                  required
                  min="0"
                  step="100"
                  value={formData.insurance_amount}
                  onChange={e => setFormData(p => ({ ...p, insurance_amount: parseFloat(e.target.value) || 0 }))}
                  className="form-input pl-7"
                  placeholder="2000"
                />
              </div>
            </div>

            <div>
              <label className="form-label">Inscripción *</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600">$</span>
                <input
                  type="number"
                  required
                  min="0"
                  step="100"
                  value={formData.enrollment_amount}
                  onChange={e => setFormData(p => ({ ...p, enrollment_amount: parseFloat(e.target.value) || 0 }))}
                  className="form-input pl-7"
                  placeholder="15000"
                />
              </div>
            </div>

            <div>
              <label className="form-label">Cuota Mensual Base (Abril-Diciembre) *</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600">$</span>
                <input
                  type="number"
                  required
                  min="0"
                  step="100"
                  value={formData.monthly_quota_amount}
                  onChange={e => setFormData(p => ({ ...p, monthly_quota_amount: parseFloat(e.target.value) || 0 }))}
                  className="form-input pl-7"
                  placeholder="5000"
                />
              </div>
              <p className="text-xs text-slate-500 mt-1">Monto a cobrar del 1 al 10 de cada mes. 9 cuotas en total</p>
            </div>
          </div>

          <div className="space-y-3 border-t pt-4">
            <h4 className="font-semibold text-slate-900">Incremento por Pago Tardío</h4>
            
            <div>
              <label className="form-label">Porcentaje de Incremento *</label>
              <div className="relative">
                <input
                  type="number"
                  required
                  min="0"
                  max="100"
                  step="0.5"
                  value={formData.increment_percentage}
                  onChange={e => setFormData(p => ({ ...p, increment_percentage: parseFloat(e.target.value) || 0 }))}
                  className="form-input"
                  placeholder="15"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600">%</span>
              </div>
            </div>

            <div className="p-3 bg-blue-50 rounded border border-blue-200">
              <p className="text-sm text-blue-800">
                <strong>Se aplica si:</strong> Se paga DESPUÉS del vencimiento Y después del primer día hábil a partir del 10.
              </p>
              <p className="text-sm text-blue-800 mt-2">
                <strong>Ejemplo:</strong> Si el 10 es sábado, el primer día hábil es lunes 12. A partir del martes 13, se cobra cuota + {formData.increment_percentage}% (si se paga después del vencimiento).
              </p>
            </div>
          </div>

          <div className="bg-slate-50 p-4 rounded">
            <p className="text-sm font-semibold text-slate-900 mb-3">Resumen (por estudiante):</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-white rounded border">
                <p className="text-xs text-slate-600 font-semibold">Cuota base</p>
                <p className="text-lg font-bold text-slate-900">
                  ${formData.monthly_quota_amount.toFixed(2)}
                </p>
              </div>
              <div className="p-3 bg-orange-50 rounded border border-orange-200">
                <p className="text-xs text-orange-600 font-semibold">Con incremento</p>
                <p className="text-lg font-bold text-orange-900">
                  ${(formData.monthly_quota_amount * (1 + formData.increment_percentage / 100)).toFixed(2)}
                </p>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t">
              <p className="text-xs text-slate-600 mb-2"><strong>Total anual (9 cuotas + seguro + inscripción):</strong></p>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-slate-600">Base:</p>
                  <p className="font-bold text-slate-900">
                    ${(formData.insurance_amount + formData.enrollment_amount + formData.monthly_quota_amount * 9).toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-orange-600">Máximo:</p>
                  <p className="font-bold text-orange-900">
                    ${(formData.insurance_amount + formData.enrollment_amount + (formData.monthly_quota_amount * 9 * (1 + formData.increment_percentage / 100))).toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t">
            <button type="submit" disabled={saving} className="btn-primary flex-1">
              {saving ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent inline-block mr-2"></div>
                  Guardando...
                </>
              ) : (
                editingConfig ? 'Actualizar' : 'Crear'
              )} Configuración
            </button>
            <button type="button" onClick={closeModal} disabled={saving} className="btn-secondary flex-1">
              Cancelar
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
