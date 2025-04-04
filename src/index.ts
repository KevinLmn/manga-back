import fastifyCors from '@fastify/cors'
import fastifyStatic from '@fastify/static'
import Fastify from 'fastify'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
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
  origin: 'http://localhost:3005',
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

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

if (!fs.existsSync(path.join(__dirname, 'images'))) {
  fs.mkdirSync(path.join(__dirname, 'images'))
}

fastify.register(fastifyStatic, {
  root: path.join(path.resolve(), 'dist/images'),
  prefix: '/dist/images/',
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
    await fastify.listen({ port: Number(process.env.PORT) || 3004 })
  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }
}

start()

export default fastify
