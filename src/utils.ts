export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export type LoginRequestBody = {
  username: string;
  password: string;
};

export type MangaIdRequestBody = {
  limit: number;
  offset: number;
};

export type DownloadMangaIdRequestBody = {
  chaptersToDownloadFrom: {
    from: number;
    to: number;
  };
};

export type DownloadMangaIdParams = {
  id: string;
};

export type MangaIdParams = {
  id: string;
};

export type DownloadChapterIdParams = {
  id: string;
};

export type ChapterIdParams = {
  id: string;
  chapterNumber: string;
};

export type MangaRequestBody = {
  mangaName: string;
};
