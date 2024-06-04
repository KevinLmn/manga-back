import fastifyCors from "@fastify/cors";
import fastifyStatic from "@fastify/static";
import axios from "axios";
import Fastify, { FastifyReply, FastifyRequest } from "fastify";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { checkIfTokenIsValidAndResetIfNot, login } from "./authentification.js";
import {
  fetchManga,
  fetchMangaById,
  getChapterImagesToDownload,
} from "./fetchManga.js";
import { assembleImages, saveImageToFile } from "./images.js";
import prisma from "./prisma.js";
import { sleep } from "./utils.js";

type RequestBody = {
  username: string;
  password: string;
};

declare module "fastify" {
  interface FastifyRequest {
    session: {
      authToken?: string;
    };
  }
}

const fastify = Fastify({ logger: true });

await fastify.register(fastifyCors, {
  origin: "*", // Autoriser toutes les origines
  methods: ["GET", "POST", "PUT", "DELETE"], // Autoriser ces méthodes HTTP
  allowedHeaders: ["Content-Type", "Authorization"], // Autoriser ces en-têtes
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
    request: FastifyRequest<{ Body: RequestBody }>,
    reply: FastifyReply
  ) => {
    const { username, password } = request.body;

    try {
      const response = await login(username, password);

      const { access_token } = await response;

      reply.send({ success: true, access_token });
    } catch (error) {
      reply.code(401).send({ success: false, message: "Invalid credentials" });
    }
  }
);

fastify.addHook("preHandler", async (request, reply) => {
  if (request.routerPath === "/login") {
    return;
  }
  try {
    await checkIfTokenIsValidAndResetIfNot(request, reply);
  } catch (e) {
    reply.code(401).send({ success: false, message: e.message });
  }
});

fastify.post("/manga", async (request, reply) => {
  const token = request.headers.authorization;
  const manga = await fetchManga(request.body.mangaName, token);
  return { manga };
});

fastify.post("/manga/:id", async (request, reply) => {
  const { id } = request.params;
  const { limit, offset } = request.body;

  const token = request.headers.authorization;
  const manga = await fetchMangaById(id, limit, offset, token);
  return { manga };
});

fastify.post("/manga/:id/download/", async (request, reply) => {
  const { id } = request.params;
  const { from, to } = request.body.chaptersToDownloadFrom;

  try {
    const manga = await prisma.manga.findUnique({
      where: {
        mangaDexId: id,
      },
    });
    if (!manga) {
      await prisma.manga.create({
        data: {
          mangaDexId: id,
        },
      });
    }
  } catch (error) {
    console.error(error);
    reply.status(500).send("An error occurred");
  }

  const token = request.headers.authorization;
  const chaptersToDownload = await getChapterImagesToDownload(
    id,
    to,
    from,
    token
  );
  try {
    const assembledImages = {};

    await Promise.all(
      Object.entries(chaptersToDownload).map(async ([key, urls]) => {
        await sleep(10000);
        const imageBuffer = await assembleImages(urls);
        const filePath = saveImageToFile(imageBuffer, `${key}.png`);
        const manga = await prisma.chapter.findUnique({
          where: {
            number_mangaId: {
              number: Number(key.split("_")[0]),
              mangaId: id,
            },
          },
        });
        if (manga) {
          await prisma.chapter.update({
            where: {
              number_mangaId: {
                number: Number(key.split("_")[0]),
                mangaId: id,
              },
            },
            data: {
              url: filePath,
            },
          });
        } else {
          await prisma.chapter.create({
            data: {
              number: Number(key.split("_")[0]),
              mangaId: id,
              url: filePath,
            },
          });
        }
        assembledImages[key] = filePath;
      })
    );

    reply.header("Content-Type", "application/json").send({
      message: "Images assembled",
      data: Object.keys(assembledImages),
    });
  } catch (error) {
    console.error(error);
    reply.status(500).send("An error occurred");
  }
});

fastify.get("/manga/:id/chapters", async (request, reply) => {
  const { id } = request.params;
  const chaptersDownloaded = await prisma.chapter.findMany({
    where: {
      mangaId: id,
    },
  });
  chaptersDownloaded.map((manga) => {
    manga.url = `http://localhost:3004${manga.url.replace(
      "/home/ikebi/manga-reader",
      ""
    )}`;
  });
  const chaptersDownloadedNumbers = chaptersDownloaded.map(
    (manga) => manga.number
  );
  let allChapters = [];
  let hasMore = true;
  let offset = 0;
  const limit = 100;
  const baseUrl = "https://api.mangadex.org";
  const token = request.headers.authorization;

  while (hasMore) {
    try {
      // await sleep(10000);
      const resp = await axios.get(
        `${baseUrl}/manga/${id}/feed?includeFuturePublishAt=0`,
        {
          params: {
            limit: limit,
            offset: offset,
            "translatedLanguage[]": "en",
            includeEmptyPages: 0,
          },
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const chapters = resp.data.data;
      allChapters = allChapters.concat(chapters);

      if (chapters.length < limit) {
        hasMore = false;
      } else {
        offset += limit;
      }
    } catch (error) {
      console.error("Error fetching chapters:", error);
      hasMore = false;
    }
  }
  allChapters = allChapters.filter((chapter) =>
    chaptersDownloadedNumbers.includes(Number(chapter.attributes.chapter))
  );

  const updatedChapters = allChapters.map((chapter) => {
    const correspondingChapter = chaptersDownloaded.find(
      (manga) => manga.number === Number(chapter.attributes.chapter)
    );
    return {
      ...chapter,
      url: correspondingChapter ? correspondingChapter.url : null,
    };
  });

  reply.send({
    chaptersLength: updatedChapters.length,
    chapters: updatedChapters.sort((a, b) => a - b).slice(0, 20),
  });
});

fastify.get("/manga/:id/chapter/:chapterNumber", async (request, reply) => {
  const { id, chapterNumber } = request.params;
  const chapter = await prisma.chapter.findUnique({
    where: {
      number_mangaId: {
        number: Number(chapterNumber),
        mangaId: id,
      },
    },
  });

  reply.send({
    ...chapter,
    url: `http://localhost:3004${chapter.url.replace(
      "/home/ikebi/manga-reader",
      ""
    )}`,
  });
});

const start = async () => {
  try {
    await fastify.listen({ port: 3004 });
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
