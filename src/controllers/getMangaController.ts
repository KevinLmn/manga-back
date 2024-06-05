import axios from "axios";
import { FastifyReply, FastifyRequest } from "fastify";
import prisma from "../prisma.js";

type MangaIdRequestBody = {
  limit: number;
  offset: number;
};

type DownloadChapterIdParams = {
  id: string;
};

type MangaIdParams = {
  id: string;
};

export const getMangaController = async (
  request: FastifyRequest<{
    Body: MangaIdRequestBody;
    Params: DownloadChapterIdParams;
    Querystring: { downloaded?: string };
  }>,
  reply
) => {
  const isDownloaded = request.query.downloaded;
  console.log(isDownloaded);

  if (isDownloaded === "true")
    return getDownloadedScansController(request, reply);
  return getNotDownloadedScansByMangaId(request, reply);
};

const getDownloadedScansController = async (
  request: FastifyRequest<{
    Body: MangaIdRequestBody;
    Params: DownloadChapterIdParams;
  }>,
  reply: FastifyReply
) => {
  console.log("hello");
  const { id } = request.params;
  const { limit, offset } = request.body;

  let chapters = await prisma.chapter.findMany({
    where: {
      mangaId: id,
    },
  });

  chapters = chapters.map((chapter) => {
    return {
      ...chapter,
      attributes: {
        volume: chapter.volume,
        chapter: chapter.number,
        releaseDate: chapter.releaseDate,
      },
    };
  });

  reply.send({
    chaptersLength: chapters.length,
    chapters: chapters
      .sort((a, b) => b.number - a.number)
      .slice(offset * limit, Math.min(offset * limit + limit, chapters.length)),
  });
};

export const getNotDownloadedScansByMangaId = async (
  request: FastifyRequest<{ Body: MangaIdRequestBody; Params: MangaIdParams }>,
  reply
) => {
  const { id } = request.params;
  const { limit, offset } = request.body;
  const token = request.headers.authorization;
  console.log("notdownloaded");

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
    return manga;
  } catch (e) {
    console.log(e);
    throw new Error("Manga not found");
  }
};
