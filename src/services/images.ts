import axios from "axios";
import fs from "fs";
import path from "path";
import sharp from "sharp";
import { fileURLToPath } from "url";
import prisma from "../prisma.js";
import { sleep } from "../utils.js";

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

export const saveImageToFile = (buffer, filename) => {
  const filePath = path.join(__dirname, "images", filename);
  fs.writeFileSync(filePath, buffer);
  return filePath;
};

export const createChapterImagesFromChapterNumbers = async (
  chaptersToDownload,
  mangaId
) => {
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
    })
  );

  return assembledImages;
};
