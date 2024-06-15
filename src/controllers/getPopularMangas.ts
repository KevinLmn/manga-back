import axios from "axios";
import { FastifyRequest } from "fastify";
import { MangaDexChapter } from "../utils.js";

type MangaRequestBody = {
  mangaName: string;
};

type MangaDexManga = Omit<MangaDexChapter, "links">;

type MangaDexResponse = {
  result: string;
  response: string;
  data: MangaDexManga[];
  limit: number;
  offset: number;
  total: number;
};

export const getPopularMangas = async (
  request: FastifyRequest<{ Body: MangaRequestBody }>
): Promise<MangaDexResponse> => {
  const token = request.headers.authorization;
  const contentRating = ["safe", "suggestive"];
  const includes = ["author", "cover_art"];
  const order = {
    rating: "desc",
    followedCount: "desc",
  };

  const finalOrderQuery = {};

  for (const [key, value] of Object.entries(order)) {
    finalOrderQuery[`order[${key}]`] = value;
  }
  try {
    const resp = await axios.get(`${process.env.MANGADEX_BASE_URL}/manga`, {
      params: {
        includes,
        contentRating,
        limit: 20,
        ...finalOrderQuery,
      },
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const manga: MangaDexResponse = resp.data;
    console.log(manga);
    return { ...manga };
  } catch (error) {
    console.error(error);
    throw new Error("Something went wrong with the search");
  }
};
