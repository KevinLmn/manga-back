import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

type GetChapterPageReturnType = {
  url: string;
  numberOfPages: number;
};

export const getChapterPage = async (
  request
): Promise<GetChapterPageReturnType> => {
  const { chapterId } = request.params;
  const { chapterPage } = request.params;
  const token = request.headers.authorization;
  const quality = request.query.quality;

  const response = await axios.get(
    `${process.env.MANGADEX_BASE_URL}/at-home/server/${chapterId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const chapter = response.data;

  const highQualityUrl = "data";
  const lowQualityUrl = "data-saver";
  const dataQualityUrl = quality === "high" ? highQualityUrl : lowQualityUrl;
  const chapterDataQualityUrl =
    quality === "high"
      ? chapter.chapter.data[chapterPage - 1]
      : chapter.chapter.dataSaver[chapterPage - 1];

  const url = `${chapter.baseUrl}/${dataQualityUrl}/${chapter.chapter.hash}/${chapterDataQualityUrl}`;

  return { url: url, numberOfPages: chapter.chapter.data.length };
};
