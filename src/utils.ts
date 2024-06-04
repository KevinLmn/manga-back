export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const TOKEN_DURATION = 900;




export type DownloadMangaIdRequestBody = {
  chaptersToDownloadFrom: {
    from: number;
    to: number;
  };
};

export type DownloadMangaIdParams = {
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
