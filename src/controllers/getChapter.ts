import { FastifyRequest } from "fastify";
import prisma from "../prisma.js";
import { ChapterIdParams } from "../utils.js";

export const getChapterController = async (
  request: FastifyRequest<{
    Params: ChapterIdParams;
  }>,
  reply
) => {
  console.log(request.params);
  const { id: mangaId, chapterNumber } = request.params;
  const chapter = await prisma.chapter.findUnique({
    where: {
      number_mangaId: {
        number: Number(chapterNumber),
        mangaId: mangaId,
      },
    },
  });

  reply.send({
    ...chapter,
    url: `http://localhost:${process.env.PORT}${chapter.url.replace(
      "/home/ikebi/manga-reader",
      ""
    )}`,
  });
};
