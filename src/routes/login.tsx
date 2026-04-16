import { createFileRoute, redirect } from '@tanstack/react-router'
import { useState } from 'react'
import React from 'react'
import { Eye, EyeOff, Lock, Mail, ChevronDown } from 'lucide-react'
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
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>('login')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [resetSent, setResetSent] = useState(false)

  // Login state
  const [loginData, setLoginData] = useState({ email: '', password: '' })

  // Register state
  const [registerData, setRegisterData] = useState({
    email: '',
    password: '',
    passwordConfirm: '',
    firstName: '',
    lastName: '',
    dni: '',
    legajo: '',
    programId: '',
    year: '1',
    selectedSubjects: [] as string[],
    accessCode: '',
  })

  const [availableSubjects, setAvailableSubjects] = useState<Array<{ id: string; name: string; code: string }>>([])
  const [codeValidated, setCodeValidated] = useState(false)
  const [programs, setPrograms] = useState<Array<{ id: string; name: string }>>([])

  // Load programs on component mount
  React.useEffect(() => {
    const loadPrograms = async () => {
      const { data } = await supabase.from('programs').select('id, name').order('name')
      if (data) setPrograms(data)
    }
    loadPrograms()
  }, [])

  // Load subjects when program or year changes
  React.useEffect(() => {
    const loadSubjects = async () => {
      if (!registerData.programId || !registerData.year) {
        setAvailableSubjects([])
        setRegisterData(prev => ({ ...prev, selectedSubjects: [] }))
        return
      }

      const { data } = await supabase
        .from('subjects')
        .select('id, name, code')
        .eq('program_id', registerData.programId)
        .eq('year', parseInt(registerData.year))
        .order('name')

      if (data) {
        setAvailableSubjects(data)
        // Pre-seleccionar todas las materias
        setRegisterData(prev => ({
          ...prev,
          selectedSubjects: data.map(s => s.id)
        }))
      } else {
        setAvailableSubjects([])
        setRegisterData(prev => ({ ...prev, selectedSubjects: [] }))
      }
    }
    loadSubjects()
  }, [registerData.programId, registerData.year])

  // Validate fixed access code
  const handleValidateAccessCode = () => {
    if (!registerData.accessCode.trim()) {
      setError('Ingresa el código de acceso.')
      return
    }

    if (registerData.accessCode.toUpperCase() === 'ISIPP25') {
      setCodeValidated(true)
      setError('')
    } else {
      setError('Código de acceso inválido.')
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    const { data, error: err } = await supabase.auth.signInWithPassword({
      email: loginData.email,
      password: loginData.password,
    })

    if (err) {
      setError('Usuario o contraseña incorrectos.')
      setLoading(false)
      return
    }

    const user = data.user
    if (!user) {
      setError('No se pudo obtener el usuario.')
      setLoading(false)
      return
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      await supabase.from('profiles').insert([{ id: user.id, email: user.email, role: 'alumno' }])
      navigate({ to: '/dashboard' })
      setLoading(false)
      return
    }

    switch (profile.role) {
      case 'admin':
      case 'operador':
        navigate({ to: '/admin' })
        break
      case 'treasurer':
        navigate({ to: '/treasurer' })
        break
      case 'professor':
      case 'profesor':
        navigate({ to: '/professor' })
        break
      case 'student':
      case 'alumno':
        navigate({ to: '/dashboard' })
        break
      default:
        navigate({ to: '/dashboard' })
    }
    setLoading(false)
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    // Basic validations
    if (!codeValidated) {
      setError('Debes validar tu código de invitación primero.')
      return
    }

    if (registerData.password !== registerData.passwordConfirm) {
      setError('Las contraseñas no coinciden.')
      return
    }

    if (!registerData.firstName || !registerData.lastName || !registerData.dni || !registerData.email || !registerData.legajo || !registerData.programId) {
      setError('Completa todos los campos.')
      return
    }

    if (registerData.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.')
      return
    }

    if (registerData.selectedSubjects.length === 0) {
      setError('Debes seleccionar al menos una materia.')
      return
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(registerData.email)) {
      setError('Por favor ingresa un email válido.')
      return
    }

    setLoading(true)

    try {
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500))

      // Create user in Auth
      const { data: authData, error: authError } = await supabase.auth.signUp(
        {
          email: registerData.email.trim().toLowerCase(),
          password: registerData.password,
          options: {
            data: {
              first_name: registerData.firstName,
              last_name: registerData.lastName,
              dni: registerData.dni,
              legajo: registerData.legajo,
              program_id: registerData.programId,
              year: parseInt(registerData.year),
            },
          },
        },
      )

      if (authError) {
        if (authError.message.includes('already registered')) {
          setError('Este correo ya está registrado. Por favor inicia sesión.')
          setMode('login')
          setLoginData({ email: registerData.email, password: '' })
        } else if (authError.message.includes('rate')) {
          setError('Demasiados intentos. Por favor espera 1 minuto y vuelve a intentar.')
        } else if (authError.message.includes('Invalid email')) {
          setError('El correo electrónico no es válido.')
        } else if (authError.message.includes('password')) {
          setError('La contraseña no cumple con los requisitos de seguridad.')
        } else {
          setError(authError.message || 'Error al crear la cuenta')
        }
        setLoading(false)
        return
      }

      if (!authData.user) {
        setError('No se pudo crear el usuario')
        setLoading(false)
        return
      }

      console.log('✅ Usuario Auth creado:', authData.user.id)

      // Create profile for user
      const profilePayload = {
        id: authData.user.id,
        email: registerData.email.trim().toLowerCase(),
        role: 'alumno',
      }

      const { error: profileError } = await supabase.from('profiles').insert([profilePayload])

      if (profileError) {
        console.error('❌ Profile creation error:', profileError)
      }

      // Auto-inscribir en las materias seleccionadas
      if (registerData.selectedSubjects.length > 0) {
        // Esperar a que el trigger cree el registro en students
        await new Promise(resolve => setTimeout(resolve, 1000))

        // Obtener el student_id
        const { data: studentData } = await supabase
          .from('students')
          .select('id')
          .eq('user_id', authData.user.id)
          .single()

        if (studentData) {
          // Crear inscripciones
          const enrollments = registerData.selectedSubjects.map(subjectId => ({
            student_id: studentData.id,
            subject_id: subjectId,
          }))

          const { error: enrollError } = await supabase
            .from('enrollments')
            .insert(enrollments)

          if (enrollError) {
            console.error('❌ Error en inscripción de materias:', enrollError)
          } else {
            console.log('✅ Alumno inscrito en', registerData.selectedSubjects.length, 'materia(s)')
          }
        }
      }

      setSuccess('Cuenta creada exitosamente. Por favor inicia sesión.')
      setRegisterData({
        email: '',
        password: '',
        passwordConfirm: '',
        firstName: '',
        lastName: '',
        dni: '',
        legajo: '',
        programId: '',
        year: '1',
        selectedSubjects: [],
        accessCode: '',
      })
      setCodeValidated(false)
      setMode('login')
      setLoginData({ email: registerData.email, password: '' })
    } catch (err) {
      console.error('Register error:', err)
      setError('Error al registrarse: ' + String(err))
    } finally {
      setLoading(false)
    }
  }

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.resetPasswordForEmail(loginData.email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })

    if (error) {
      setError('Error al enviar el email: ' + error.message)
    } else {
      setResetSent(true)
    }

    setLoading(false)
  }

  const toggleSubject = (subjectId: string) => {
    setRegisterData(prev => ({
      ...prev,
      selectedSubjects: prev.selectedSubjects.includes(subjectId)
        ? prev.selectedSubjects.filter(id => id !== subjectId)
        : [...prev.selectedSubjects, subjectId]
    }))
  }

  return (
    <div className="siu-login-page relative flex items-center justify-center p-4 min-h-screen bg-cover bg-center bg-no-repeat" style={{
      backgroundImage: 'linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url(/isipp-building.jpg)',
      backgroundAttachment: 'fixed',
    }}>

      <div className="relative w-full max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Panel - Info */}
          <div className="hidden lg:flex flex-col justify-center space-y-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-2 h-12 bg-gradient-to-b from-[var(--siu-blue)] to-[var(--isipp-bordo)] rounded-full"></div>
                <h1 className="text-5xl font-bold text-white">
                  Sistema Académico
                </h1>
              </div>
              <p className="text-lg text-slate-300 leading-relaxed">
                Plataforma integral para la gestión de procesos académicos del Instituto Superior de Informática Puerto Piray.
              </p>
            </div>

            <div className="space-y-4">
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-4 hover:bg-white/15 transition-colors">
                <h3 className="font-bold text-blue-300 mb-3 text-base">📚 Para Estudiantes</h3>
                <ul className="text-sm text-slate-300 space-y-1.5">
                  <li>✓ Panel de control académico</li>
                  <li>✓ Inscripción a materias</li>
                  <li>✓ Consultar asistencia</li>
                  <li>✓ Inscripción a exámenes</li>
                  <li>✓ Historial completo</li>
                  <li>✓ Descarga de certificados</li>
                </ul>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                <h3 className="font-bold text-slate-200 mb-3 text-sm">🔒 Acceso Seguro</h3>
                <p className="text-xs text-slate-400">Autenticación protegida. Tu información está segura.</p>
              </div>
            </div>
          </div>

          {/* Right Panel - Form */}
          <div className="w-full max-w-md mx-auto lg:mx-0 max-h-[90vh] overflow-y-auto">
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-[var(--isipp-bordo)] to-[var(--siu-blue)] p-8 text-center sticky top-0">
                <div className="mb-3">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/20">
                    <Mail className="w-8 h-8 text-white" />
                  </div>
                </div>
                <h2 className="text-2xl font-bold text-white mb-1">Acceso Seguro</h2>
                <p className="text-sm text-white/90">Sistema de Gestión Académica</p>
              </div>

              {/* Tabs */}
              {mode !== 'forgot' && (
                <div className="flex border-b border-slate-200">
                  <button
                    onClick={() => { setMode('login'); setError(''); setSuccess('') }}
                    className={`flex-1 py-3 font-semibold text-sm transition-colors ${
                      mode === 'login'
                        ? 'text-[var(--siu-blue)] border-b-2 border-[var(--siu-blue)] bg-blue-50'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Iniciar sesión
                  </button>
                  <button
                    onClick={() => { setMode('register'); setError(''); setSuccess(''); setCodeValidated(false) }}
                    className={`flex-1 py-3 font-semibold text-sm transition-colors ${
                      mode === 'register'
                        ? 'text-[var(--siu-blue)] border-b-2 border-[var(--siu-blue)] bg-blue-50'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Registrarse
                  </button>
                </div>
              )}

              {/* Content */}
              <div className="p-8">
                {error && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                    {error}
                  </div>
                )}
                {success && (
                  <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg text-sm">
                    {success}
                  </div>
                )}

                {mode === 'login' && (
                  <>
                    <h3 className="text-lg font-bold text-slate-900 mb-1">Bienvenido</h3>
                    <p className="text-sm text-slate-600 mb-6">Ingresa tus credenciales para acceder</p>
                    <form onSubmit={handleLogin} className="space-y-4">
                      <div>
                        <label className="form-label block text-sm font-semibold text-slate-900 mb-2">Correo electrónico</label>
                        <div className="relative">
                          <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                          <input
                            type="email"
                            value={loginData.email}
                            onChange={e => setLoginData({ ...loginData, email: e.target.value })}
                            required
                            autoComplete="email"
                            className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--siu-blue)] focus:border-transparent transition"
                            placeholder="tu@email.com"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="form-label block text-sm font-semibold text-slate-900 mb-2">Contraseña</label>
                        <div className="relative">
                          <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                          <input
                            type={showPass ? 'text' : 'password'}
                            value={loginData.password}
                            onChange={e => setLoginData({ ...loginData, password: e.target.value })}
                            required
                            autoComplete="current-password"
                            className="w-full pl-10 pr-10 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--siu-blue)] focus:border-transparent transition"
                            placeholder="••••••••"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPass(!showPass)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                          >
                            {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                          </button>
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-[var(--isipp-bordo)] to-[var(--siu-blue)] hover:shadow-lg text-white font-bold py-3 rounded-lg transition-all disabled:opacity-50"
                      >
                        {loading ? 'Ingresando...' : 'Ingresar'}
                      </button>
                    </form>

                    <button
                      type="button"
                      onClick={() => { setMode('forgot'); setError(''); setResetSent(false) }}
                      className="w-full mt-4 text-center text-sm text-[var(--siu-blue)] hover:text-[var(--siu-navy)] font-semibold"
                    >
                      ¿Olvidó su contraseña?
                    </button>
                  </>
                )}

                {mode === 'register' && (
                  <>
                    <h3 className="text-lg font-bold text-slate-900 mb-1">Crear cuenta</h3>
                    <p className="text-sm text-slate-600 mb-6">Completa el formulario para registrarte</p>
                    <form onSubmit={handleRegister} className="space-y-4">
                      {/* Access Code Section */}
                      {!codeValidated && (
                        <div className="mb-6 p-4 bg-blue-50 border border-blue-300 rounded-lg">
                          <label className="block text-sm font-semibold text-slate-900 mb-3">🔐 Código de Acceso</label>
                          <p className="text-xs text-slate-600 mb-3">Ingresa el código de acceso para comenzar el registro</p>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={registerData.accessCode}
                              onChange={e => setRegisterData({ ...registerData, accessCode: e.target.value })}
                              placeholder="Ingresa el código"
                              className="flex-1 px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <button
                              type="button"
                              onClick={handleValidateAccessCode}
                              disabled={loading}
                              className="px-4 py-2.5 bg-[var(--siu-blue)] text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
                            >
                              {loading ? '...' : 'Validar'}
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Code Validated Success Message */}
                      {codeValidated && (
                        <div className="mb-6 p-3 bg-emerald-50 border border-emerald-300 rounded-lg">
                          <p className="text-sm text-emerald-700 font-semibold">✓ Código validado correctamente</p>
                        </div>
                      )}

                      {/* Registration Form Fields */}
                      {codeValidated && (
                        <>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs font-semibold text-slate-900 mb-1.5">Nombre</label>
                              <input
                                type="text"
                                value={registerData.firstName}
                                onChange={e => setRegisterData({ ...registerData, firstName: e.target.value })}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--siu-blue)]"
                                placeholder="Juan"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-semibold text-slate-900 mb-1.5">Apellido</label>
                              <input
                                type="text"
                                value={registerData.lastName}
                                onChange={e => setRegisterData({ ...registerData, lastName: e.target.value })}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--siu-blue)]"
                                placeholder="Pérez"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs font-semibold text-slate-900 mb-1.5">DNI</label>
                              <input
                                type="text"
                                value={registerData.dni}
                                onChange={e => setRegisterData({ ...registerData, dni: e.target.value })}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--siu-blue)]"
                                placeholder="12345678"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-semibold text-slate-900 mb-1.5">Legajo</label>
                              <input
                                type="text"
                                value={registerData.legajo}
                                onChange={e => setRegisterData({ ...registerData, legajo: e.target.value })}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--siu-blue)]"
                                placeholder="2024001"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-slate-900 mb-1.5">Carrera</label>
                            <select
                              value={registerData.programId}
                              onChange={e => setRegisterData({ ...registerData, programId: e.target.value })}
                              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--siu-blue)]"
                            >
                              <option value="">-- Selecciona una carrera --</option>
                              {programs.map(prog => (
                                <option key={prog.id} value={prog.id}>
                                  {prog.name}
                                </option>
                              ))}
                            </select>
                          </div>

                          {registerData.programId && (
                            <div>
                              <label className="block text-xs font-semibold text-slate-900 mb-1.5">Año</label>
                              <select
                                value={registerData.year}
                                onChange={e => setRegisterData({ ...registerData, year: e.target.value })}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--siu-blue)]"
                              >
                                <option value="1">1° Año</option>
                                <option value="2">2° Año</option>
                                <option value="3">3° Año</option>
                              </select>
                            </div>
                          )}

                          {availableSubjects.length > 0 && (
                            <div className="border-t pt-4">
                              <label className="block text-xs font-semibold text-slate-900 mb-3">
                                Selecciona materias ({registerData.selectedSubjects.length}/{availableSubjects.length})
                              </label>
                              <div className="space-y-2 max-h-48 overflow-y-auto">
                                {availableSubjects.map(subject => (
                                  <label key={subject.id} className="flex items-center gap-3 p-2 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors">
                                    <input
                                      type="checkbox"
                                      checked={registerData.selectedSubjects.includes(subject.id)}
                                      onChange={() => toggleSubject(subject.id)}
                                      className="w-4 h-4 text-[var(--siu-blue)] rounded border-slate-300 focus:ring-2 focus:ring-[var(--siu-blue)]"
                                    />
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-medium text-slate-900 truncate">{subject.name}</p>
                                      <p className="text-xs text-slate-500">{subject.code}</p>
                                    </div>
                                  </label>
                                ))}
                              </div>
                            </div>
                          )}

                          <div>
                            <label className="block text-xs font-semibold text-slate-900 mb-1.5">Correo electrónico</label>
                            <input
                              type="email"
                              value={registerData.email}
                              onChange={e => setRegisterData({ ...registerData, email: e.target.value })}
                              autoComplete="email"
                              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--siu-blue)]"
                              placeholder="tu@email.com"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-slate-900 mb-1.5">Contraseña</label>
                            <input
                              type={showPass ? 'text' : 'password'}
                              value={registerData.password}
                              onChange={e => setRegisterData({ ...registerData, password: e.target.value })}
                              autoComplete="new-password"
                              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--siu-blue)]"
                              placeholder="••••••••"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-slate-900 mb-1.5">Confirmar contraseña</label>
                            <div className="relative">
                              <input
                                type={showPass ? 'text' : 'password'}
                                value={registerData.passwordConfirm}
                                onChange={e => setRegisterData({ ...registerData, passwordConfirm: e.target.value })}
                                autoComplete="new-password"
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--siu-blue)]"
                                placeholder="••••••••"
                              />
                              <button
                                type="button"
                                onClick={() => setShowPass(!showPass)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                              >
                                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                              </button>
                            </div>
                          </div>

                          <button
                            type="submit"
                            disabled={loading || !codeValidated}
                            className="w-full bg-gradient-to-r from-[var(--isipp-bordo)] to-[var(--siu-blue)] hover:shadow-lg text-white font-bold py-3 rounded-lg transition-all disabled:opacity-50 mt-6"
                          >
                            {loading ? 'Registrando...' : 'Crear cuenta'}
                          </button>
                        </>
                      )}
                    </form>
                  </>
                )}

                {mode === 'forgot' && (
                  <>
                    <h3 className="text-lg font-bold text-slate-900 mb-1">Recuperar contraseña</h3>
                    <p className="text-sm text-slate-600 mb-6">Ingresa tu correo para recibir instrucciones</p>

                    {resetSent ? (
                      <div className="text-center py-6">
                        <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                          <span className="text-2xl">✓</span>
                        </div>
                        <p className="text-slate-900 font-semibold mb-2">Correo enviado</p>
                        <p className="text-sm text-slate-600">Revisa tu bandeja de entrada para las instrucciones de recuperación.</p>
                      </div>
                    ) : (
                      <form onSubmit={handleReset} className="space-y-4">
                        <div>
                          <label className="block text-sm font-semibold text-slate-900 mb-2">Correo electrónico</label>
                          <input
                            type="email"
                            value={loginData.email}
                            onChange={e => setLoginData({ ...loginData, email: e.target.value })}
                            required
                            className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--siu-blue)]"
                            placeholder="tu@email.com"
                          />
                        </div>

                        <button
                          type="submit"
                          disabled={loading}
                          className="w-full bg-gradient-to-r from-[var(--isipp-bordo)] to-[var(--siu-blue)] hover:shadow-lg text-white font-bold py-3 rounded-lg transition-all disabled:opacity-50"
                        >
                          {loading ? 'Enviando...' : 'Enviar instrucciones'}
                        </button>
                      </form>
                    )}

                    <button
                      type="button"
                      onClick={() => { setMode('login'); setResetSent(false) }}
                      className="w-full mt-4 text-center text-sm text-[var(--siu-blue)] hover:text-[var(--siu-navy)] font-semibold"
                    >
                      ← Volver al inicio
                    </button>
                  </>
                )}
              </div>
            </div>

            <p className="mt-6 text-center text-xs text-slate-400">
              © {new Date().getFullYear()} Instituto Superior de Informática Puerto Piray 
              <br />
              <span className="text-lg">•</span>
              <br />
              Created and developed by <strong>Cristian L. Medina</strong>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
