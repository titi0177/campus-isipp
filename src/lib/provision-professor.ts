interface ProvisionRequest {
  accessToken: string
  email: string
  dni: string
  name: string
  department: string
}

interface ProvisionResponse {
  ok: boolean
  message: string
}

export async function provisionProfessorWithAuth(req: {
  data: ProvisionRequest
}): Promise<ProvisionResponse> {
  try {
    const response = await fetch('/api/provision-professor', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(req.data),
    })

    const data: ProvisionResponse = await response.json()

    if (!response.ok) {
      return {
        ok: false,
        message: data.message || 'Error desconocido',
      }
    }

    return data
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : 'Error desconocido',
    }
  }
}
