import fastifyCors from '@fastify/cors'
import Fastify from 'fastify'
import { downloadChaptersController } from './controllers/downloadChapters.js'
import {
  getFavoriteMangaController,
  postFavoriteMangaController,
} from './controllers/favoriteManga.js'
import { getChapterController } from './controllers/getChapter.js'
import { getChapterPage } from './controllers/getChapterPage.js'
import { getLatestMangas } from './controllers/getLatestMangas.js'
import { getMangaController } from './controllers/getMangaController.js'
import { getPopularMangas } from './controllers/getPopularMangas.js'
import { loginController } from './controllers/login.js'
import { refreshTokenController } from './controllers/refreshToken.js'
import { searchMangaController } from './controllers/searchMangaController.js'
import { loginMiddleware } from './middlewares.js'

// declare module "fastify" {
//   interface FastifyRequest {
//     session: {
//       authToken?: string;
//     };
//   }
// }

const fastify = Fastify({
  logger: true,
  ignoreTrailingSlash: true,
})

await fastify.register(fastifyCors, {
  origin: process.env.NEXT_PUBLIC_FRONT_END_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Accept',
    'Authorization',
    'X-Requested-With',
  ],
  exposedHeaders: ['Content-Disposition', 'Content-Type', 'Content-Length'],
})

fastify.addHook('preHandler', loginMiddleware)

fastify.post('/refreshToken', refreshTokenController)

fastify.post('/login', loginController)

fastify.post('/manga', searchMangaController)

interface DownloadMangaIdParams {
  id: string
  chapterId: string
}

fastify.get<{
  Params: DownloadMangaIdParams
}>('/manga/:id/download/:chapterId', async (request, reply) => {
  return downloadChaptersController(request, reply)
})

fastify.post('/manga/:id', getMangaController)

fastify.get('/manga/:id/chapter/:chapterNumber', getChapterController)

fastify.get('/manga/chapter/:chapterId/:chapterPage', getChapterPage)

fastify.get('/popular', getPopularMangas)

fastify.get('/latest', getLatestMangas)

fastify.post('/favoriteManga', postFavoriteMangaController)

fastify.get('/favoriteManga', getFavoriteMangaController)

// Add health check route for Render
fastify.get('/health', async (request, reply) => {
  return { status: 'ok' }
})

const start = async () => {
  try {
    const port = parseInt(process.env.PORT || '3004', 10)
    await fastify.listen({
      port,
      host: '0.0.0.0',
    })
    console.log(`Server is running on port ${port}`)
  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }
}

start()

export default fastify
