import axios from "axios";

export const getChapterPage = async (request, reply) => {
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

  console.log(chapter);

  const highQualityUrl = "data";
  const lowQualityUrl = "data-saver";

  const url = `${chapter.baseUrl}/${
    quality === "high" ? highQualityUrl : lowQualityUrl
  }/${chapter.chapter.hash}/${
    quality === "high"
      ? chapter.chapter.data[chapterPage - 1]
      : chapter.chapter.dataSaver[chapterPage - 1]
  }`;

  console.log(chapter.chapter.dataSaver);
  console.log(chapterPage);
  console.log(url);
  return { url: url, numberOfPages: chapter.chapter.data.length };
};
