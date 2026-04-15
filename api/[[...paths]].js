import { createServerEntry } from '../dist/server/server.js'

const handler = createServerEntry()

export default async function (req, res) {
  try {
    const response = await handler.fetch(req)
    
    // Copiar headers
    for (const [key, value] of response.headers) {
      res.setHeader(key, value)
    }
    
    // Copiar status
    res.status(response.status)
    
    // Copiar body
    res.send(await response.text())
  } catch (error) {
    console.error('API Error:', error)
    res.status(500).json({ error: 'Internal Server Error' })
  }
}
