import { supabase } from './supabase'

export async function sendAbsenceEmail(
  professorName: string,
  subject: string,
  articuloType: string,
  absenceDate: string,
  timeStart: string,
  timeEnd: string,
  description: string,
  documentUrl: string,
  documentName: string
) {
  const destinationEmail = import.meta.env.VITE_PROFESSOR_ABSENCES_EMAIL || 'isip1206@gmail.com'
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL

  try {
    // Obtener el token JWT del usuario autenticado
    const { data: { session } } = await supabase.auth.getSession()
    const token = session?.access_token

    // Llamar a la Edge Function de Supabase
    const response = await fetch(`${supabaseUrl}/functions/v1/send-absence-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        professorName,
        subject,
        articuloType,
        absenceDate,
        timeStart,
        timeEnd,
        description,
        documentUrl,
        documentName,
        destinationEmail,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      console.error('Error from Edge Function:', error)
      throw new Error(error.details || error.error || 'Failed to send email')
    }

    const data = await response.json()
    return { success: true, messageId: data.messageId }
  } catch (error) {
    console.error('Error sending email:', error)
    throw error
  }
}
