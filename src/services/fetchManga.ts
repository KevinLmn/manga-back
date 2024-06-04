import axios from "axios";
import prisma from "../prisma.js";
import { sleep } from "../utils.js";

export const fetchMangaByIdAndChapter = async (access_token, id) => {
  try {
    const resp = await axios.get(
      `${process.env.MANGADEX_BASE_URL}/at-home/server/02d4b220-4b17-4051-b364-f5c197c5036e`,
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }
    );
    return resp.data;
  } catch (e) {
    throw new Error("Manga not found");
  }
};

export const getChapter = async (chapterNumber, mangaId) => {
  const chapter = await prisma.chapter.findUnique({
    where: {
      number_mangaId: {
        number: Number(chapterNumber),
        mangaId: mangaId,
      },
    },
  });
  return chapter;
};

export const getDownloadedChapters = async (mangaId) => {
  const chapters = await prisma.chapter.findMany({
    where: {
      mangaId: mangaId,
    },
  });
  return chapters;
};

export const getChaptersPerManga = async (id, chaptersDownloaded, token) => {
  chaptersDownloaded.map((manga) => {
    manga.url = `http://localhost:${process.env.PORT}${manga.url.replace(
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

  while (hasMore) {
    try {
      await sleep(10000);
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

  return updatedChapters;
};
