import axios from "axios";
import { sleep } from "./utils.js";

const baseUrl = "https://api.mangadex.org";

export const fetchManga = async (mangaName, access_token) => {
  try {
    const resp = await axios.get(`${baseUrl}/manga`, {
      params: {
        title: mangaName,
        includes: ["author", "cover_art"],
        contentRating: ["safe", "suggestive", "erotica", "pornographic"],
        limit: 20,
      },
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    });
    return resp.data;
  } catch (e) {
    console.log(e);
  }
};

export const fetchMangaById = async (id, limit, offset, access_token) => {
  try {
    const resp = await axios.get(
      `${baseUrl}/manga/${id}/feed?includeFuturePublishAt=0`,
      {
        params: {
          limit: limit,
          offset: offset * limit,
          "order[chapter]": "desc",
          "translatedLanguage[]": "en",
        },
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }
    );
    return resp.data;
  } catch (e) {
    console.log(e);
  }
};

export const fetchMangaByIdAndChapter = async (access_token, id) => {
  try {
    const resp = await axios.get(
      `${baseUrl}/at-home/server/02d4b220-4b17-4051-b364-f5c197c5036e`,
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }
    );
    return resp.data;
  } catch (e) {
    console.log(e);
  }
};

export const getChapterImagesToDownload = async (id, to, from, token) => {
  let allChapters = [];
  let hasMore = true;
  let offset = 0;
  const limit = 100;

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
      console.error("Error fetching chapters:", error);
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
      `${baseUrl}/at-home/server/${chapter.id}`,
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

  const hello = await fetchAllChapterLinks();
  return hello;
};
