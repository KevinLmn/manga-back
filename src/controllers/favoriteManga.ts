import { FastifyReply, FastifyRequest } from 'fastify'

type FavoriteMangaBody = {
  userId: number
  mangaId: number
}

export type getFavoriteMangaParams = {
  userId: number
}

export const postFavoriteMangaController = async (
  request: FastifyRequest<{
    Body: FavoriteMangaBody
  }>,
  reply: FastifyReply
) => {
  const { userId, mangaId } = request.body

  return `User ${userId} favorited Manga ${mangaId}`
}

export const getFavoriteMangaController = async (
  request: FastifyRequest<{
    Params: getFavoriteMangaParams
  }>,
  reply: FastifyReply
) => {
  const { userId } = request.params
  return `User ${userId} favorite's Mangas are TODO`
}
