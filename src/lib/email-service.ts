import { Resend } from 'resend'

const resend = new Resend(import.meta.env.VITE_RESEND_API_KEY)

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

  const emailContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center; }
    .header h2 { margin: 0; font-size: 24px; }
    .content { padding: 20px; }
    .row { margin: 12px 0; }
    .label { font-weight: bold; color: #667eea; }
    .separator { border-top: 1px solid #eee; margin: 20px 0; padding-top: 20px; }
    .file-section { background: #f5f5f5; padding: 15px; border-radius: 6px; margin: 15px 0; }
    .download-link { color: #667eea; text-decoration: none; font-weight: bold; }
    .footer { text-align: center; font-size: 12px; color: #999; margin-top: 30px; border-top: 1px solid #eee; padding-top: 15px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>📋 Justificación de Inasistencia Docente</h2>
      <p style="margin: 10px 0 0 0; opacity: 0.9;">Sistema de notificación automática</p>
    </div>
    
    <div class="content">
      <div class="row">
        <span class="label">👤 Docente:</span> ${professorName}
      </div>
      
      <div class="row">
        <span class="label">📚 Materia:</span> ${subject}
      </div>
      
      <div class="row">
        <span class="label">📅 Fecha de inasistencia:</span> ${absenceDate}
      </div>
      
      <div class="row">
        <span class="label">⏰ Hora:</span> ${timeStart} - ${timeEnd}
      </div>
      
      <div class="row">
        <span class="label">📄 Artículo / Motivo:</span> ${articuloType}
      </div>
      
      ${description ? `
      <div class="row">
        <span class="label">📝 Descripción:</span><br>
        <div style="margin-top: 8px; padding: 10px; background: #f9f9f9; border-left: 3px solid #667eea;">
          ${description}
        </div>
      </div>
      ` : ''}
      
      <div class="separator"></div>
      
      <div class="file-section">
        <h3 style="margin-top: 0; color: #333;">📎 Documento Adjunto</h3>
        <p><strong>Archivo:</strong> ${documentName}</p>
        <p>
          <a href="${documentUrl}" class="download-link" target="_blank">
            🔗 Descargar documento completado
          </a>
        </p>
      </div>
      
      <div class="footer">
        <p>⏱️ Recibido: ${new Date().toLocaleString('es-AR')}</p>
        <p>Sistema Campus ISIPP - Gestión Académica</p>
      </div>
    </div>
  </div>
</body>
</html>
  `

  try {
    const result = await resend.emails.send({
      from: 'Sistema Campus ISIPP <onboarding@resend.dev>',
      to: destinationEmail,
      subject: `Justificación de Inasistencia - ${professorName} - ${absenceDate}`,
      html: emailContent,
    })

    return { success: true, messageId: result.data?.id }
  } catch (error) {
    console.error('Error sending email:', error)
    throw error
  }
}
