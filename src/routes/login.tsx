import { createFileRoute, redirect } from '@tanstack/react-router'
import { useState } from 'react'
import React from 'react'
import { Eye, EyeOff, Lock, Mail } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useNavigate } from '@tanstack/react-router'
import { GraduationCelebration } from '@/components/GraduationCelebration'

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

  const [loginData, setLoginData] = useState({ email: '', password: '' })

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
    accessCode: '',
  })

  const [codeValidated, setCodeValidated] = useState(false)
  const [programs, setPrograms] = useState<Array<{ id: string; name: string }>>([])
  const [showGraduationModal, setShowGraduationModal] = useState(false)
  const [graduationData, setGraduationData] = useState<{ studentName: string; programName: string } | null>(null)

  React.useEffect(() => {
    const loadPrograms = async () => {
      const { data } = await supabase.from('programs').select('id, name').order('name')
      if (data) setPrograms(data)
    }
    loadPrograms()
  }, [])

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

    // ✅ VALIDAR STATUS DEL ESTUDIANTE
    try {
      const { data: student, error: studentError } = await supabase
        .from('students')
        .select('status, first_name, program:programs(name)')
        .eq('user_id', user.id)
        .single()

      if (studentError) {
        console.warn('Advertencia al obtener estudiante:', studentError.message)
        // Continuar si no es un error crítico
      }

      const studentStatus = student?.status ?? 'active'

      // ❌ SUSPENDIDO O INACTIVO
      if (studentStatus === 'suspended') {
        setError('Tu cuenta ha sido suspendida. Por favor contacta con administración.')
        setLoading(false)
        return
      }

      if (studentStatus === 'inactive') {
        setError('Tu cuenta está inactiva. Por favor contacta con administración para reactivarla.')
        setLoading(false)
        return
      }

      // 🎓 GRADUADO
      if (studentStatus === 'graduated' && student) {
        setGraduationData({
          studentName: `${student.first_name}`,
          programName: student.program?.name ?? 'Tu carrera',
        })
        setShowGraduationModal(true)
        setLoading(false)
        return
      }
    } catch (err) {
      console.error('Error validando estudiante:', err)
      // Continuar si falla la validación (mejor UX que bloquear)
    }

    // ✅ OBTENER PERFIL Y NAVEGAR
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

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(registerData.email)) {
      setError('Por favor ingresa un email válido.')
      return
    }

    setLoading(true)

    // ✅ VALIDACIÓN PREVIA: Verificar legajo y DNI duplicados ANTES de registrarse
    try {
      const { data: validation, error: validationError } = await supabase.rpc('check_duplicate_legajo_dni', {
        p_legajo: registerData.legajo.trim(),
        p_dni: registerData.dni.trim(),
      })

      if (validationError) {
        console.error('Error validating duplicates:', validationError)
        setError('Error al validar datos. Por favor intenta de nuevo.')
        setLoading(false)
        return
      }

      if (validation && validation.length > 0 && validation[0].is_duplicate) {
        setError(validation[0].error_message || 'Este dato ya está registrado en el sistema.')
        setLoading(false)
        return
      }
    } catch (err) {
      console.error('Validation check error:', err)
      // No bloquear si falla la validación previa
    }

    try {
      await new Promise(resolve => setTimeout(resolve, 500))

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: registerData.email.trim().toLowerCase(),
        password: registerData.password,
        options: {
          data: {
            first_name: registerData.firstName,
            last_name: registerData.lastName,
            program_id: registerData.programId,
            legajo: registerData.legajo,
            dni: registerData.dni,
            year: registerData.year,
          },
        },
      })

      if (authError) {
        if (authError.message.includes('already registered')) {
          setError('Este correo ya está registrado. Por favor inicia sesión.')
          setMode('login')
          setLoginData({ email: registerData.email, password: '' })
        } else if (authError.message.includes('El legajo') && authError.message.includes('ya está registrado')) {
          setError('El legajo ya está registrado en el sistema.')
        } else if (authError.message.includes('El DNI') && authError.message.includes('ya está registrado')) {
          setError('El DNI ya está registrado en el sistema.')
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

      // Crear perfil
      const profilePayload = {
        id: authData.user.id,
        email: registerData.email.trim().toLowerCase(),
        role: 'alumno',
      }

      const { error: profileError } = await supabase.from('profiles').insert([profilePayload])

      if (profileError) {
        console.error('❌ Profile creation error:', profileError)
      }

      // El trigger automáticamente creará el estudiante en students table
      // Solo necesitamos esperar y recuperarlo
      console.log('⏳ Esperando que el trigger cree el estudiante...')
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      const { data: studentRecord, error: studentError } = await supabase
        .from('students')
        .select('id')
        .eq('user_id', authData.user.id)
        .single()

      if (studentError || !studentRecord) {
        console.error('❌ No se pudo recuperar estudiante creado por trigger:', studentError)
        setError('Error al obtener registro de estudiante')
        setLoading(false)
        return
      }

      const studentId = studentRecord.id
      console.log('✅ Estudiante recuperado del trigger:', studentId)

      // Inscripciones automáticas según año
      const selectedYear = parseInt(registerData.year)
      const currentAcademicYear = new Date().getFullYear()

      if (selectedYear === 1) {
        console.log('✅ Alumno de 1° año - sin inscripciones automáticas')
      } else if (selectedYear === 2) {
        console.log('⏳ Iniciando inscripción automática para 2° año...')
        const { data: subjectsYear1, error: subjectsError } = await supabase
          .from('subjects')
          .select('id, name')
          .eq('program_id', registerData.programId)
          .eq('year', 1)

        if (subjectsError) {
          console.error('❌ Error al consultar materias de 1° año:', subjectsError)
        } else if (subjectsYear1 && subjectsYear1.length > 0) {
          console.log(`📚 Encontradas ${subjectsYear1.length} materias de 1° año`)
          
          const enrollments = subjectsYear1.map(subject => ({
            student_id: studentId,
            subject_id: subject.id,
            academic_year: currentAcademicYear,
            status: 'active',
            attempt_number: 1,
          }))

          const { error: enrollError, data: enrollData } = await supabase
            .from('enrollments')
            .insert(enrollments)
            .select('id')

          if (enrollError) {
            console.error('❌ Error en inscripción de 1° año:', enrollError)
          } else if (enrollData && enrollData.length > 0) {
            console.log(`✅ Alumno inscrito en ${enrollData.length} materias de 1° año`)
          }
        }
      } else if (selectedYear === 3) {
        console.log('⏳ Iniciando inscripción automática para 3° año...')
        const { data: subjectsYear1And2, error: subjectsError } = await supabase
          .from('subjects')
          .select('id, name, year')
          .eq('program_id', registerData.programId)
          .in('year', [1, 2])

        if (subjectsError) {
          console.error('❌ Error al consultar materias de 1° y 2° año:', subjectsError)
        } else if (subjectsYear1And2 && subjectsYear1And2.length > 0) {
          console.log(`📚 Encontradas ${subjectsYear1And2.length} materias de 1° y 2° año`)
          
          const enrollments = subjectsYear1And2.map(subject => ({
            student_id: studentId,
            subject_id: subject.id,
            academic_year: currentAcademicYear,
            status: 'active',
            attempt_number: 1,
          }))

          const { error: enrollError, data: enrollData } = await supabase
            .from('enrollments')
            .insert(enrollments)
            .select('id')

          if (enrollError) {
            console.error('❌ Error en inscripción de 1° y 2° año:', enrollError)
          } else if (enrollData && enrollData.length > 0) {
            console.log(`✅ Alumno inscrito en ${enrollData.length} materias de 1° y 2° año`)
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

  const handleDownloadCertificate = () => {
    // Redirigir a la página de certificados o descargar directamente
    window.location.href = '/dashboard/certificates'
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

  return (
    <>
      {showGraduationModal && graduationData && (
        <GraduationCelebration
          studentName={graduationData.studentName}
          programName={graduationData.programName}
          onContinue={() => {
            setShowGraduationModal(false)
            navigate({ to: '/dashboard' })
          }}
          onDownloadCert={handleDownloadCertificate}
        />
      )}
    <div className="siu-login-page relative flex items-center justify-center p-4 min-h-screen bg-cover bg-center bg-no-repeat" style={{
      backgroundImage: 'linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url(/isipp-building.jpg)',
      backgroundAttachment: 'fixed',
    }}>

      <div className="relative w-full max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
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

          <div className="w-full max-w-md mx-auto lg:mx-0">
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl overflow-hidden">
              <div className="bg-gradient-to-r from-[var(--isipp-bordo)] to-[var(--siu-blue)] p-8 text-center">
                <div className="mb-3">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/20">
                    <Mail className="w-8 h-8 text-white" />
                  </div>
                </div>
                <h2 className="text-2xl font-bold text-white mb-1">Acceso Seguro</h2>
                <p className="text-sm text-white/90">Sistema de Gestión Académica</p>
              </div>

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

                      {codeValidated && (
                        <div className="mb-6 p-3 bg-emerald-50 border border-emerald-300 rounded-lg">
                          <p className="text-sm text-emerald-700 font-semibold">✓ Código validado correctamente</p>
                        </div>
                      )}

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

                          <div>
                            <label className="block text-xs font-semibold text-slate-900 mb-1.5">Año de ingreso</label>
                            <select
                              value={registerData.year}
                              onChange={e => setRegisterData({ ...registerData, year: e.target.value })}
                              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--siu-blue)]"
                            >
                              <option value="1">1° Año</option>
                              <option value="2">2° Año (inscribe en 1° y 2°)</option>
                              <option value="3">3° Año (inscribe en 1°, 2° y 3°)</option>
                            </select>
                          </div>

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
    </>
  )
}
