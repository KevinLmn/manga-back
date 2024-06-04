import axios from "axios";
import { FastifyReply, FastifyRequest } from "fastify";
import fs from "fs";
import prisma from "../prisma.js";

import path from "path";
import sharp from "sharp";
import { fileURLToPath } from "url";
import {
  DownloadMangaIdParams,
  DownloadMangaIdRequestBody,
  sleep,
} from "../utils.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function downloadImages(urls) {
  const images = await Promise.all(
    urls.map(async (url) => {
      const response = await axios.get(url, { responseType: "arraybuffer" });
      const buffer = Buffer.from(response.data, "binary");
      await sleep(3000);
      return buffer;
    })
  );
  return images;
}

export async function assembleImages(urls) {
  await sleep(10000);
  const imageBuffers = await downloadImages(urls);

  const images = await Promise.all(
    imageBuffers.map(async (buffer) => {
      if (buffer) {
        const { width, height } = await sharp(buffer).metadata();
        return { buffer, width, height };
      } else {
        throw new Error("Buffer is empty or invalid");
      }
    })
  );
  const wantedWidth = 1080;
  const totalHeight = images.reduce(
    (sum, img) => sum + img.height * (wantedWidth / img.width),
    0
  );

  let yOffset = 0;
  let compositeList = [];

  for (const img of images) {
    const scaleFactor = wantedWidth / img.width;
    const scaledHeight = Math.round(img.height * scaleFactor);
    compositeList.push({
      input: await sharp(img.buffer)
        .resize(wantedWidth, scaledHeight)
        .toBuffer(),
      top: yOffset,
      left: 0,
    });
    yOffset += scaledHeight;
  }

  const assembledImage = sharp({
    create: {
      width: wantedWidth,
      height: Math.round(totalHeight),
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite(compositeList)
    .png();

  return assembledImage.toBuffer();
}

if (!fs.existsSync(path.join(__dirname, "images"))) {
  fs.mkdirSync(path.join(__dirname, "images"));
}

export const downloadChaptersController = async (
  request: FastifyRequest<{
    Body: DownloadMangaIdRequestBody;
    Params: DownloadMangaIdParams;
  }>,
  reply: FastifyReply
) => {
  const { id: mangaId } = request.params;
  const { from, to } = request.body.chaptersToDownloadFrom;
  const token = request.headers.authorization;

  const manga = await prisma.manga.findUnique({
    where: {
      mangaDexId: mangaId,
    },
  });
  if (!manga) {
    await prisma.manga.create({
      data: {
        mangaDexId: mangaId,
      },
    });
  }

  let allChapters = [];
  let hasMore = true;
  let offset = 0;
  const limit = 100;

  while (hasMore) {
    try {
      const resp = await axios.get(
        `${process.env.MANGADEX_BASE_URL}/manga/${mangaId}/feed?includeFuturePublishAt=0`,
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
      hasMore = false;
    }
  }
  const numbersToDownload = [];
  for (let i = Number(from); i <= Number(to); i++) {
    numbersToDownload.push(i);
  }
  allChapters = allChapters.filter((chapter) =>
    numbersToDownload.includes(Number(chapter.attributes.chapter))
  );

  let chaptersToDownload = {};

  const fetchChapterLinks = async (chapter) => {
    await sleep(10000);
    const response = await axios.get(
      `${process.env.MANGADEX_BASE_URL}/at-home/server/${chapter.id}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const downloadLinks = [];
    const data = response.data.chapter.data;

    data.forEach((scanData) => {
      downloadLinks.push(
        `${response.data.baseUrl}/data/${response.data.chapter.hash}/${scanData}`
      );
    });

    return {
      key: `${chapter.attributes.chapter}_${chapter.id}`,
      links: downloadLinks,
    };
  };

  const fetchAllChapterLinks = async () => {
    const promises = allChapters.map(fetchChapterLinks);
    const results = await Promise.all(promises);

    results.forEach((result) => {
      chaptersToDownload[result.key] = result.links;
    });

    return chaptersToDownload;
  };

  const chaptersToDownloadData = await fetchAllChapterLinks();

  const assembledImages = {};

  Object.entries(chaptersToDownloadData).map(async ([key, urls]) => {
    await sleep(10000);
    const imageBuffer = await assembleImages(urls);
    const filePath = saveImageToFile(imageBuffer, `${key}.png`);
    const manga = await prisma.chapter.findUnique({
      where: {
        number_mangaId: {
          number: Number(key.split("_")[0]),
          mangaId: mangaId,
        },
      },
    });
    if (manga) {
      await prisma.chapter.update({
        where: {
          number_mangaId: {
            number: Number(key.split("_")[0]),
            mangaId: mangaId,
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
          mangaId: mangaId,
          url: filePath,
        },
      });
    }
    assembledImages[key] = filePath;
  });

  reply.header("Content-Type", "application/json").send({
    message: "Images assembled",
    data: Object.keys(assembledImages),
  });
};

export const saveImageToFile = (buffer, filename) => {
  const filePath = path
    .join(__dirname, "images", filename)
    .replace("/controllers", "");
  fs.writeFileSync(filePath, buffer);
  return filePath;
};
