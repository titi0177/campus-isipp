import { createRequestHandler } from '@tanstack/react-start/server'
import { getRouterManifest } from './dist/server/index.js'

const handler = createRequestHandler({
  getRouterManifest,
})

export default handler
