import fastifyCors from "@fastify/cors";
import fastifyStatic from "@fastify/static";
import Fastify, { FastifyReply, FastifyRequest } from "fastify";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import {
  MangaIdParams,
  MangaIdRequestBody,
  getMangaByIdController,
} from "./controllers/getMangaById.js";
import { getMangaBySearchController } from "./controllers/getMangaBySearch.js";
import { LoginRequestBody, loginController } from "./controllers/login.js";
import { loginMiddleware } from "./middlewares.js";
import {
  checkIfMangaExistsAndCreateIfNot,
  getChapter,
  getChapterImagesToDownload,
  getChaptersPerManga,
  getDownloadedChapters,
} from "./services/fetchManga.js";
import { createChapterImagesFromChapterNumbers } from "./services/images.js";
import {
  ChapterIdParams,
  DownloadChapterIdParams,
  DownloadMangaIdParams,
  DownloadMangaIdRequestBody,
  MangaRequestBody,
} from "./utils.js";

declare module "fastify" {
  interface FastifyRequest {
    session: {
      authToken?: string;
    };
  }
}

const fastify = Fastify({ logger: true });

await fastify.register(fastifyCors, {
  origin: "*",
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

if (!fs.existsSync(path.join(__dirname, "images"))) {
  fs.mkdirSync(path.join(__dirname, "images"));
}

fastify.register(fastifyStatic, {
  root: path.join(path.resolve(), "dist/images"),
  prefix: "/dist/images/",
});

fastify.post(
  "/login",
  async (
    request: FastifyRequest<{ Body: LoginRequestBody }>,
    reply: FastifyReply
  ) => {
    await loginController(request, reply);
  }
);

fastify.addHook(
  "preHandler",
  async (request: FastifyRequest, reply: FastifyReply) => {
    await loginMiddleware(request, reply);
  }
);

fastify.post(
  "/manga",
  async (request: FastifyRequest<{ Body: MangaRequestBody }>) => {
    return await getMangaBySearchController(request);
  }
);

fastify.post(
  "/manga/:id",
  async (
    request: FastifyRequest<{ Body: MangaIdRequestBody; Params: MangaIdParams }>
  ) => {
    return await getMangaByIdController(request);
  }
);

fastify.post(
  "/manga/:id/download/",
  async (
    request: FastifyRequest<{
      Body: DownloadMangaIdRequestBody;
      Params: DownloadMangaIdParams;
    }>,
    reply: FastifyReply
  ) => {
    const { id } = request.params;
    const { from, to } = request.body.chaptersToDownloadFrom;
    const token = request.headers.authorization;

    try {
      await checkIfMangaExistsAndCreateIfNot(id);
    } catch (error) {
      reply.status(500).send("An error occurred");
    }

    const chaptersToDownload = await getChapterImagesToDownload(
      id,
      to,
      from,
      token
    );

    try {
      const assembledImages = await createChapterImagesFromChapterNumbers(
        chaptersToDownload,
        id
      );

      reply.header("Content-Type", "application/json").send({
        message: "Images assembled",
        data: Object.keys(assembledImages),
      });
    } catch (error) {
      reply.status(500).send("An error occurred");
    }
  }
);

fastify.get(
  "/manga/:id/chapters",
  async (
    request: FastifyRequest<{
      Params: DownloadChapterIdParams;
    }>,
    reply
  ) => {
    const { id } = request.params;
    const token = request.headers.authorization;

    const chaptersDownloaded = await getDownloadedChapters(id);

    const chapters = await getChaptersPerManga(id, chaptersDownloaded, token);

    reply.send({
      chaptersLength: chapters.length,
      chapters: chapters
        .sort((a, b) => b.attributes.chapter - a.attributes.chapter)
        .slice(10, 20),
    });
  }
);

fastify.get(
  "/manga/:id/chapter/:chapterNumber",
  async (
    request: FastifyRequest<{
      Params: ChapterIdParams;
    }>,
    reply
  ) => {
    const { id: mangaId, chapterNumber } = request.params;
    const chapter = await getChapter(chapterNumber, mangaId);

    reply.send({
      ...chapter,
      url: `http://localhost:${process.env.PORT}${chapter.url.replace(
        "/home/ikebi/manga-reader",
        ""
      )}`,
    });
  }
);

const start = async () => {
  try {
    await fastify.listen({ port: Number(process.env.PORT) || 3004 });
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
