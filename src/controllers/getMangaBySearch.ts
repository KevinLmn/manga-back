import axios from "axios";
import { FastifyRequest } from "fastify";
import { MangaRequestBody } from "../utils.js";

export const getMangaBySearchController = async (
  request: FastifyRequest<{ Body: MangaRequestBody }>
) => {
  const { mangaName } = request.body;
  const token = request.headers.authorization;
  try {
    const resp = await axios.get(`${process.env.MANGADEX_BASE_URL}/manga`, {
      params: {
        title: mangaName,
        includes: ["author", "cover_art"],
        contentRating: ["safe", "suggestive", "erotica", "pornographic"],
        limit: 20,
      },
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const manga = resp.data;
    return { manga };
  } catch (e) {
    throw new Error("Manga not found");
  }
};
