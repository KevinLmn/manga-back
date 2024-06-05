import fastifyCors from "@fastify/cors";
import fastifyStatic from "@fastify/static";
import Fastify from "fastify";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { downloadChaptersController } from "./controllers/downloadChapters.js";
import { getChapterController } from "./controllers/getChapter.js";
import { getMangaController } from "./controllers/getMangaController.js";
import { loginController } from "./controllers/login.js";
import { searchMangaController } from "./controllers/searchMangaController.js";
import { loginMiddleware } from "./middlewares.js";

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

fastify.post("/login", loginController);

fastify.addHook("preHandler", loginMiddleware);

fastify.post("/manga", searchMangaController);

fastify.post("/manga/:id/download/", downloadChaptersController);

fastify.post("/manga/:id", getMangaController);

fastify.get("/manga/:id/chapter/:chapterNumber", getChapterController);

const start = async () => {
  try {
    await fastify.listen({ port: Number(process.env.PORT) || 3004 });
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
