import prisma from '../prisma.js'
import { ApiError, MangaDexChapter } from '../utils.js'

export class DatabaseService {
  async findOrCreateManga(mangaId: string) {
    try {
      const manga = await prisma.manga.findUnique({
        where: {
          mangaDexId: mangaId,
        },
      })

      if (!manga) {
        return prisma.manga.create({
          data: {
            mangaDexId: mangaId,
          },
        })
      }

      return manga
    } catch (error) {
      throw new ApiError(
        `Failed to find or create manga: ${error.message}`,
        500,
        { mangaId }
      )
    }
  }

  async findOrCreateChapter(
    mangaId: string,
    chapter: MangaDexChapter,
    filePath: string
  ) {
    try {
      const existingChapter = await prisma.chapter.findUnique({
        where: {
          number_mangaId: {
            number: Number(chapter.attributes.chapter),
            mangaId: mangaId,
          },
        },
      })

      if (existingChapter) {
        return prisma.chapter.update({
          where: {
            number_mangaId: {
              number: Number(chapter.attributes.chapter),
              mangaId: mangaId,
            },
          },
          data: {
            url: filePath,
            volume: Number(chapter.attributes.volume),
            releaseDate: new Date(chapter.attributes.publishAt),
            pages: chapter.links?.length || 0,
          },
        })
      }

      return prisma.chapter.create({
        data: {
          number: Number(chapter.attributes.chapter),
          mangaId: mangaId,
          url: filePath,
          volume: Number(chapter.attributes.volume),
          releaseDate: new Date(chapter.attributes.publishAt),
          pages: chapter.links?.length || 0,
        },
      })
    } catch (error) {
      throw new ApiError(
        `Failed to find or create chapter: ${error.message}`,
        500,
        { mangaId, chapterNumber: chapter.attributes.chapter }
      )
    }
  }

  async deleteChapter(mangaId: string, chapterNumber: number) {
    try {
      return prisma.chapter.delete({
        where: {
          number_mangaId: {
            number: chapterNumber,
            mangaId: mangaId,
          },
        },
      })
    } catch (error) {
      throw new ApiError(`Failed to delete chapter: ${error.message}`, 500, {
        mangaId,
        chapterNumber,
      })
    }
  }
}
