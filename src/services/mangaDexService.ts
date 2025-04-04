import axios from 'axios'
import prisma from '../prisma.js'
import { ApiError, MangaDexChapter } from '../utils.js'

export class MangaDexService {
  private baseUrl: string
  private token: string | null

  constructor(token?: string) {
    this.baseUrl = process.env.MANGADEX_BASE_URL || 'https://api.mangadex.org'
    this.token = token || null
  }

  private async getAuthHeaders() {
    if (this.token) {
      return { Authorization: `Bearer ${this.token}` }
    }

    console.log('Getting latest token from database...')
    const latestToken = await prisma.token.findFirst({
      orderBy: {
        createdAt: 'desc',
      },
    })

    if (!latestToken) {
      console.error('No token found in database')
      throw new ApiError('No valid token found. Please login first.', 401)
    }

    console.log('Found token created at:', latestToken.createdAt)
    const tokenAge = Date.now() - latestToken.createdAt.getTime()
    console.log('Token age (minutes):', Math.floor(tokenAge / 1000 / 60))

    return { Authorization: `Bearer ${latestToken.token}` }
  }

  async getMangaChapters(
    mangaId: string,
    limit: number = 100,
    offset: number = 0
  ): Promise<MangaDexChapter[]> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/manga/${mangaId}/feed?includeFuturePublishAt=0`,
        {
          params: {
            limit,
            offset,
            'translatedLanguage[]': 'en',
            includeEmptyPages: 0,
          },
          headers: await this.getAuthHeaders(),
        }
      )
      return response.data.data
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new ApiError(
          `Failed to fetch manga chapters: ${error.message}`,
          error.response?.status || 500,
          error.response?.data
        )
      }
      throw new ApiError(`Failed to fetch manga chapters: ${error.message}`)
    }
  }

  async getChapterDownloadLinks(chapterId: string): Promise<string[]> {
    try {
      console.log('Getting auth headers for chapter download...')
      const headers = await this.getAuthHeaders()
      console.log('Fetching chapter data from MangaDex...')

      const response = await axios.get(
        `${this.baseUrl}/at-home/server/${chapterId}`,
        { headers }
      )

      if (!response.data?.chapter?.data) {
        console.error('Invalid response format:', response.data)
        throw new Error('Invalid response format from MangaDex')
      }

      const links = response.data.chapter.data.map(
        (scanData: string) =>
          `${response.data.baseUrl}/data/${response.data.chapter.hash}/${scanData}`
      )

      console.log(`Generated ${links.length} download links`)
      return links
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('MangaDex API error:', {
          status: error.response?.status,
          data: error.response?.data,
          headers: error.response?.headers,
        })
        throw new ApiError(
          `Failed to fetch chapter download links: ${error.message}`,
          error.response?.status || 500,
          error.response?.data
        )
      }
      console.error('Non-Axios error:', error)
      throw new ApiError(
        `Failed to fetch chapter download links: ${error.message}`
      )
    }
  }
}
