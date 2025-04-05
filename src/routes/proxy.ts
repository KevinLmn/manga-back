import { FastifyInstance } from 'fastify'
import fetch from 'node-fetch'

export async function proxyRoutes(fastify: FastifyInstance) {
  fastify.get('/proxy/image', async (request, reply) => {
    const { url } = request.query as { url: string }

    if (!url) {
      fastify.log.error('No URL provided to proxy')
      reply.code(400).send({ error: 'URL parameter is required' })
      return
    }

    try {
      fastify.log.info(`Proxying image from: ${url}`)
      console.log('Received request with URL:', url)

      // Validate that the URL is from MangaDex
      const urlObj = new URL(url)
      console.log('Parsed URL:', {
        hostname: urlObj.hostname,
        pathname: urlObj.pathname,
        search: urlObj.search,
      })

      if (
        !urlObj.hostname.includes('mangadex.org') &&
        !urlObj.hostname.includes('mangadex.network')
      ) {
        fastify.log.error(`Invalid hostname: ${urlObj.hostname}`)
        reply.code(400).send({ error: 'Only MangaDex URLs are allowed' })
        return
      }

      console.log('Making fetch request to:', url)
      const response = await fetch(url)
      console.log('Fetch response status:', response.status)

      if (!response.ok) {
        fastify.log.error(
          `Failed to fetch image: ${response.status} ${response.statusText}`
        )
        reply
          .code(response.status)
          .send({ error: 'Failed to fetch image from source' })
        return
      }

      const contentType = response.headers.get('content-type')
      const contentLength = response.headers.get('content-length')
      console.log('Response headers:', {
        contentType,
        contentLength,
        allHeaders: Object.fromEntries(response.headers.entries()),
      })

      reply
        .header('Content-Type', contentType)
        .header('Content-Length', contentLength)
        .header('Cache-Control', 'public, max-age=31536000')
        .header('Access-Control-Allow-Origin', '*')
        .header('Access-Control-Allow-Methods', 'GET')
        .header('Access-Control-Allow-Headers', 'Content-Type')

      return response.body.pipe(reply.raw)
    } catch (error) {
      console.error('Error in proxy route:', error)
      fastify.log.error('Error proxying image:', error)
      reply.code(500).send({ error: 'Failed to fetch image' })
    }
  })
}
