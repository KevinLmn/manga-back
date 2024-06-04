import axios from "axios";
import { FastifyRequest } from "fastify";

export type MangaIdRequestBody = {
  limit: number;
  offset: number;
};

export type MangaIdParams = {
  id: string;
};

export const getMangaByIdController = async (
  request: FastifyRequest<{ Body: MangaIdRequestBody; Params: MangaIdParams }>
) => {
  const { id } = request.params;
  const { limit, offset } = request.body;
  const token = request.headers.authorization;

  try {
    const resp = await axios.get(
      `https://api.mangadex.org/manga/${id}/feed?includeFuturePublishAt=0`,
      {
        params: {
          limit: limit,
          offset: offset * limit,
          "order[chapter]": "desc",
          "translatedLanguage[]": "en",
        },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    const manga = resp.data;
    return { manga };
  } catch (e) {
    throw new Error("Manga not found");
  }
};
