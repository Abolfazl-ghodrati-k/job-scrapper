import puppeteer, { Browser, ElementHandle, Mouse, Page } from "puppeteer";
import moment from "moment";
import LanguageDetect from "languagedetect";
import { getHashtags, sleep, locations, saveJobToDataBase } from "@/app/utils/tools";
import { logger } from "@/app/utils/logger";
import Last from "@/app/models/Last";
import { JobDoc as Job } from "../../models/Job";
import {
  checkAcceptCookies,
  saveCookies,
  setCookies,
  setLocalStorage,
} from "./cookies";
import { isNotLoggedIn, login } from "./helpers";
import { launchBrowser } from "../helpers";

const lngDetector = new LanguageDetect();


const source = "glassdoor";
const glassdoorURL = "https://www.glassdoor.com";
const IS_PRODUCTION = process.env.NODE_ENV === "production";

var initPage: Page | null = null;

const crawlGlassDoor = async (): Promise<void> => {
  let browser = await launchBrowser()
  initPage = await browser.newPage();
  await initPage.setCacheEnabled(false);

  if (!initPage) {
    throw new Error("Pupeteer not working");
  }
  await setCookies(initPage);

  try {
    await getJobs(initPage);
  } catch (error) {
    logger("Glassdoor error: " + error);
  }
  logger("glassdoor done");
};

export { launchBrowser, crawlGlassDoor };

const getJobs = async (page: Page): Promise<void> => {
  await gotToGlassDoor(page);
  for (let i = 0; i < locations.length; i++) {
    try {
      await searchJobs(page, locations[i].id);
      await parsePageJobs(page, locations[i].name)
      await sleep(3000);
    } catch (error) {
      logger(
        `error in search jobs function in glassdoor ${error}`
      );
    }
  }
};

const gotToGlassDoor = async (page: Page) => {
  logger("opening glassdoor ...");
  await page.goto("https://www.glassdoor.com", { timeout: 120000 });

  await page.waitForSelector('a[data-test="global-nav-glassdoor-logo"]', {
    timeout: 60000,
  }),
    logger("glassdoor opened!");
  await setLocalStorage(page);
  if (await isNotLoggedIn(page)) {
    logger("Needs to login");
    await login(page);
  } else logger("Already logged In");
};

async function searchJobs(page: Page, locationId: number) {
  let jobsLink = `https://www.glassdoor.com/Job/jobs.htm?sc.keyword=react%20developer%20remote&locT=N&locId=${locationId}`;

  logger(`Searching for jobs in glassdoor: ${locationId}`);
  await page.goto(jobsLink, { timeout: 120000 });
  const finalUrl = page.url();
  const newUrl = finalUrl + "&fromAge=30";
  await page.goto(newUrl, { timeout: 120000 });
}

async function parsePageJobs(page: Page, country: string) {
  const listItems = await page.$$(`li[data-test="jobListing"]`);
  let today = moment().format("YYYY-MM-DD");

  for (const listItem of listItems) {
    try {
      const foundJob = await prepareFoundJob(listItem, page, today);
      if (foundJob) {
        await saveJobToDataBase(foundJob)
      }
    } catch (error) {
      logger(`Error processing job: ${error}`);
    }
  }
}

const prepareFoundJob = async (
  listItem: ElementHandle<HTMLLIElement>,
  page: Page,
  today: string
) => {
  await sleep(3000 + Math.random() * 600);
  const { location, url, company, title } = await listItem.evaluate(
    (element: Element) => {
      return {
        location: element.querySelector('[data-test="emp-location"]')
          ?.textContent,
        url: element.querySelector("a")?.getAttribute("href"),
        company: (
          element.querySelectorAll(
            ".EmployerProfile_employerName__Xemli"
          )[0] as HTMLElement
        )?.innerText,
        title: (
          element.querySelectorAll(".JobCard_seoLink__WdqHZ")[0] as HTMLElement
        )?.innerText,
      };
    }
  );

  const guid = company + title;
  const exist = await Last.findOne({
    where: source,
    guid: guid,
  });

  // Uncomment the following block if you want to save to the database
  // if (guid && !exist) {
  //   await new Last({
  //     where: source,
  //     guid: guid,
  //   }).save();
  // }

  const { content, isEnglish } = await getJobContent(page, listItem);
  if (isEnglish) {
    const foundJob = {
      location: location ? location : "location not found",
      url: `${glassdoorURL}${url}`,
      company,
      title,
      content: content,
      source,
      when: today,
      hashtags: getHashtags(content),
      options: null,
    };
    return foundJob;
  }
};

async function getJobContent(
  page: Page,
  item: ElementHandle<SVGElement | HTMLElement>
) {
  await item.click();
  await sleep(Math.random() * 500);
  let content = "no content found on this job position";
  try {
    await page.waitForSelector(".JobDetails_jobDescription__6VeBn");
    const contentTag = await page.$(".JobDetails_jobDescription__6VeBn");
    content =
      (await contentTag?.evaluate(
        (element: Element) => element?.textContent
      )) || "no content found on this job position";
  } catch (error) {
    content = "Error on recieving job details";
  }

  return {
    content,
    isEnglish:
      lngDetector.detect(content, 1).length > 0
        ? lngDetector.detect(content, 1)[0][0] == "english"
        : false,
  };
}
