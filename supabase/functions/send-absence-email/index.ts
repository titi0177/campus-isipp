import { serve } from "https://deno.land/std@0.208.0/http/server.ts"

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")

console.log("[init] RESEND_API_KEY configured:", !!RESEND_API_KEY)

serve(async (req) => {
  // CORS headers
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS, GET",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    })
  }

  // Solo POST permitido
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    })
  }

  try {
    const body = await req.json()
    console.log("[request] Received:", { professorName: body.professorName, absenceDate: body.absenceDate })

    const {
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
    } = body

    // Validar campos requeridos
    if (!professorName || !subject || !absenceDate || !documentName || !documentUrl) {
      console.error("[validation] Missing required fields:", {
        professorName: !!professorName,
        subject: !!subject,
        absenceDate: !!absenceDate,
        documentName: !!documentName,
        documentUrl: !!documentUrl,
      })
      return new Response(
        JSON.stringify({ 
          error: "Missing required fields",
          received: { professorName, subject, absenceDate, documentName, documentUrl }
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        }
      )
    }

    if (!RESEND_API_KEY) {
      console.error("[config] RESEND_API_KEY not configured")
      return new Response(
        JSON.stringify({ error: "RESEND_API_KEY not configured on server" }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        }
      )
    }

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

    const toEmail = destinationEmail || "isip1206@gmail.com"
    console.log("[email] Sending to: criss0177@gmail.com (testing mode)")
    console.log("[email] Original destination was:", toEmail)

    // Enviar email via Resend
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Sistema Campus ISIPP <onboarding@resend.dev>",
        to: "criss0177@gmail.com",
        subject: `Justificación de Inasistencia - ${professorName} - ${absenceDate}`,
        html: emailContent,
      }),
    })

    const responseData = await response.json()

    if (!response.ok) {
      console.error("[resend] Error response:", response.status, responseData)
      throw new Error(`Resend API error: ${response.status} - ${JSON.stringify(responseData)}`)
    }

    console.log("[resend] Email sent successfully:", responseData.id)

    return new Response(
      JSON.stringify({ success: true, messageId: responseData.id }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    )
  } catch (error) {
    console.error("[error] Exception:", error instanceof Error ? error.message : String(error))
    return new Response(
      JSON.stringify({
        error: "Failed to send email",
        details: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    )
  }
})
