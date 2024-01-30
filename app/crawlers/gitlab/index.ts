import { Page } from "puppeteer";
import { launchBrowser } from "../helpers";
import Last from "@/app/models/Last";
import LanguageDetect from "languagedetect";
import moment from "moment";
import { getHashtags, saveJobToDataBase } from "@/app/utils/tools";
import { logger } from "@/app/utils/logger";
const source = "GitLab";

const lngDetector = new LanguageDetect();

const crawlGitLab = async (keyWords: string[]) => {
  const browser = await launchBrowser();
  const initPage = await browser.newPage();
  const foundPositions = await searchGitlabBoards(initPage, keyWords);

  if (foundPositions && foundPositions.length > 0) {
    logger(foundPositions.length.toString());
    await getJobsContentAndSave(initPage, foundPositions);
  }
};

const searchGitlabBoards = async (page: Page, keyWords: string[]) => {
  logger("Opening GitlabBoard ... ");
  await page.goto("https://boards.greenhouse.io/gitlab", { timeout: 120000 });
  const allPositions = await page.$$(`div.opening`);
  logger("GitlabBoards opened and all positions recieved");

  let filteredPositions = [];

  // filtering positions based on keyword
  try {
    for (const position of allPositions) {
      const { title, url } = await position.evaluate((element) => {
        return {
          title: element.querySelector("a")?.innerText,
          url: element.querySelector("a")?.href,
        };
      });

      if (title && url) {
        const titleMatchs = keyWords.some((keyword) =>
          title.toLowerCase().includes(keyword.toLowerCase())
        );
        if (titleMatchs) {
          let guid = title + url;
          const exist = await Last.findOne({
            where: source,
            guid: guid,
          });

          if (!exist) {
            // await new Last({
            //   where: source,
            //   guid: guid,
            // }).save();

            filteredPositions.push({
              title,
              url,
            });
          }
        }
      }
    }
  } catch (error) {
     logger(`Error on Filtering positions: ${error}`)
  }

  logger("Position Filtering Proccess finished.")

  return filteredPositions;
};

const getJobsContentAndSave = async (
  page: Page,
  positions: {
    title: string;
    url: string;
  }[]
) => {
  logger("Modifiying anfd saving process executed")
  let today = moment().format("YYYY-MM-DD");

  for (const { url, title } of positions) {
    await page.goto(url, { timeout: 1200000 });

    let content = "no content found on this job position";

    try {
      const contentTag = await page.$("div#content");
      content =
        (await contentTag?.evaluate(
          (element: Element) => element?.textContent
        )) || "no content found on this job position";
    } catch (error) {
     logger(`Error on recieving content: ${error}`)
    }

    //     //     verify content
    const isEnglish =
      lngDetector.detect(content, 1).length > 0
        ? lngDetector.detect(content, 1)[0][0] == "english"
        : false;

    if (isEnglish) {
      // create object
      const preparedJob = {
        location:
          (await page
            .$(".location")
            .then((tag) => tag?.evaluate((element) => element.textContent))) ??
          "no location found on this position",
        url,
        company:
          (await page
            .$(".company-name")
            .then((tag) => tag?.evaluate((element) => element.textContent))) ??
          "no company name found on this position",
        content,
        title,
        source,
        when: today,
        hashtags: getHashtags(content),
        options: null,
      };
      logger(`found job on gitlab: ${preparedJob.title}`);
      await saveJobToDataBase(preparedJob);
      // save to database
    }
  }
};

export { crawlGitLab };
