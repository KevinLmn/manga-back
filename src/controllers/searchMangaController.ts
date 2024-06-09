import axios from "axios";
import { FastifyRequest } from "fastify";
import { MangaRequestBody } from "../utils.js";

export const searchMangaController = async (
  request: FastifyRequest<{ Body: MangaRequestBody }>,
  reply
) => {
  const { mangaName } = request.body;
  const token = request.headers.authorization;
  try {
    const resp = await axios.get(`${process.env.MANGADEX_BASE_URL}/manga`, {
      params: {
        title: mangaName,
        includes: ["author", "cover_art"],
        contentRating: ["safe", "suggestive"],
        limit: 20,
      },
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const manga = resp.data;
    return reply.send({ manga });
  } catch (e) {
    console.log(e);
    throw new Error("Manga not found");
  }
};
