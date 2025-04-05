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
      // Decode the URL to handle double encoding
      const decodedUrl = decodeURIComponent(url)
      fastify.log.info(`Proxying image from: ${decodedUrl}`)

      // Validate that the URL is from MangaDex
      const urlObj = new URL(decodedUrl)
      if (
        !urlObj.hostname.includes('mangadex.org') &&
        !urlObj.hostname.includes('mangadex.network')
      ) {
        fastify.log.error(`Invalid hostname: ${urlObj.hostname}`)
        reply.code(400).send({ error: 'Only MangaDex URLs are allowed' })
        return
      }

      const response = await fetch(decodedUrl)
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

      // Set response headers
      reply.raw.writeHead(200, {
        'Content-Type': contentType || 'image/jpeg',
        'Content-Length': contentLength || '',
        'Cache-Control': 'public, max-age=31536000',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Content-Type',
      })

      // Stream the response
      if (response.body) {
        response.body.pipe(reply.raw)
      } else {
        throw new Error('Response body is null')
      }
    } catch (error) {
      console.error('Error in proxy route:', error)
      fastify.log.error('Error proxying image:', error)
      reply.code(500).send({ error: 'Failed to fetch image' })
    }
  })
}
