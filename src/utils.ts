export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const TOKEN_DURATION = 900;

export type MangaDexChapter = {
  id: string;
  type: string;
  attributes: {
    volume: string;
    chapter: string;
    title: string;
    translatedLanguage: string;
    externalUrl: null;
    publishAt: Date;
    readableAt: Date;
    createdAt: Date;
    updatedAt: Date;
    pages: number;
    version: number;
  };
  relationships: {
    id: string;
    type: string;
  }[];
  links?: string[];
};
