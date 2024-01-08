import path from "path";
import { promises as fs } from "fs";
import puppeteer, { ElementHandle, Page } from "puppeteer";
import moment from "moment";
import LanguageDetect from "languagedetect";
const storageFolder = `${__dirname}/../storage`;
import { getHashtags, sleep, locations } from "@/app/utils/tools";
import { logger } from "@/app/utils/logger";
import Last from "@/app/models/Last";

const lngDetector = new LanguageDetect();

var initPage: Page | null = null;

const source = "glassdoor";
const glassdoorURL = "https://www.glassdoor.com";
const IS_PRODUCTION = process.env.NODE_ENV === "production";

// HELPERS -----------------------------------------------------

async function isNotLoggedIn(page: Page) {
  const buttonExists = await page.evaluate((text) => {
    const button = Array.from(document.getElementsByTagName("button")).find(
      (b) => b.innerText === text
    );
    return !!button;
  }, "Sign In");

  return buttonExists;
}

// TYPEs ----------------------------------------------------------

type Job = {
  location: string;
  url: string;
  company: string;
  title: string;
  content: string;
  when: string;
  source: string;
  hashtags: string[];
};

const launchBrowser = async () => {
  logger("Launching Browser");

  const browser = IS_PRODUCTION
    ? // Connect to browserless so we don't run Chrome on the same hardware in production
      await puppeteer.connect({
        browserWSEndpoint: `wss://chrome.browserless.io?token=${process.env.BLESS_TOKEN}`,
      })
    : // Run the browser locally while in development
      await puppeteer.launch({
        headless: false,
      });

  initPage = await browser.newPage();
  // await initPage.setCacheEnabled(false);
  logger("Browser Launched Successfully!");
};

const crawlGlassDoor = async (): Promise<Job[] | undefined> => {
  if (!initPage) {
    logger("Pupeteer not working");
    return;
  }

  // await setCookies(initPage);

  let jobs: Job[] = [];

  try {
    jobs = await getJobs(initPage);
  } catch (error) {
    logger("Glassdoor error: " + error);
  }
  logger("glassdoor done");
  return jobs;
};

export { launchBrowser, crawlGlassDoor };

const getJobs = async (page: Page): Promise<Job[]> => {
  await gotToGlassDoor(page);
  let jobs: Job[] = [];
  for (let i = 0; i < locations.length; i++) {
    await searchJobs(page, locations[i].id);
    jobs.push(...(await parsePageJobs(page, locations[i].name)));
    await sleep(3000);
  }
  return jobs;
};

const gotToGlassDoor = async (page: Page) => {
  logger("opening glassdoor ...");
  await page.goto("https://www.glassdoor.com", { timeout: 60000 });
  await page.waitForSelector('a[data-test="global-nav-glassdoor-logo"]', {
    timeout: 60000,
  }),
    logger("glassdoor opened!");
  // await setLocalStorage(page);
  if (await isNotLoggedIn(page)) {
    logger("Needs to login");
    await login(page);
  } else logger("Already logged In");
};

async function login(page: Page) {
  //Sometimes need to click on Accept Cookies button
  // await checkAcceptCookies(page);
  logger("logging in glassdoor");

  await page.click(".email-input");

  const glassDoorUserName = process.env.GLASSDORR_USERNAME;
  const glassDoorPassword = process.env.GLASSDOOR_PASSWORD;
  if (!glassDoorPassword || !glassDoorUserName) {
    logger("No glassdoor password or username found in .env");
    return;
  }

  await page.type("#inlineUserEmail", glassDoorUserName, {
    delay: 100,
  });
  await page.click('button[data-test="email-form-button"]'); //click on continue with email button
  // await page.screenshot({ path: path.resolve(storageFolder, 'inlineUserPassword.png') }
  await page.waitForSelector("#inlineUserPassword", { timeout: 60000 });
  await page.type("#inlineUserPassword", glassDoorPassword, {
    delay: 100,
  });
  await page.click('button[name="submit"]'); //click on Sign In button

  await page.waitForSelector(
    'button[data-test="desktop-utility-nav-profile-button"]'
  );
  logger("Sigined In glassdoor successfully");
  // await saveCookies(page);
}

async function searchJobs(page: Page, locationId: number) {
  let jobsLink = `https://www.glassdoor.com/Job/jobs.htm?sc.keyword=react%20developer%20remote&locT=N&locId=${locationId}`;

  logger(`Searching for jobs in glassdoor: ${locationId}`);
  await page.goto(jobsLink, { timeout: 60000 });
  await page.waitForSelector('button[data-test="fromAge"]', { timeout: 60000 });
  // wait for Posted time div

  const finalUrl = page.url();
  const newUrl = finalUrl + "&fromAge=30";
  await page.goto(newUrl, { timeout: 60000 });
  await page.waitForSelector('button[data-test="fromAge"]', { timeout: 60000 });
}

async function parsePageJobs(page: Page, country: string) {
  let jobs = [];
  const listItems = await page.$$(`li[data-test="jobListing"]`);
  let today = moment().format("YYYY-MM-DD");

  for (const listItem of listItems) {
    // await listItem.click()
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
            element.querySelectorAll(
              ".JobCard_seoLink__WdqHZ"
            )[0] as HTMLElement
          )?.innerText,
        };
      }
    );

    const guid = company + title;
    const exist = await Last.findOne({
      where: source,
      guid: guid,
    });

    if (guid && !exist) {
      await new Last({
        where: source,
        guid: guid,
      }).save();

      const { content, isEnglish } = await getJobContent(
        page,
        listItem
      );
      if (isEnglish) {
        const foundJob = {
          location: `${country}-${location}`,
          url: `${glassdoorURL}${url}`,
          company,
          title,
          content: content,
          when: today,
          source,
          hashtags: getHashtags(content),
          options: null,
        };
        jobs.push(foundJob);
      }
    }
    await sleep(3000);
  }

  return jobs;
}

async function getJobContent(
  page: Page,
  item: ElementHandle<SVGElement | HTMLElement>
) {
  await item.click();
  // logger(`here is the page url: ${page.url()}`)
  // let content = "this is a bomb, take care";
  await page.waitForSelector(".JobDetails_jobDescription__6VeBn");

  const contentTag = await page.$(".JobDetails_jobDescription__6VeBn");

  const content =
    (await contentTag?.evaluate((element: Element) => element?.textContent)) ||
    "no content found on this job position";

  return {
    content,
    isEnglish:
      lngDetector.detect(content, 1).length > 0
        ? lngDetector.detect(content, 1)[0][0] == "english"
        : false,
  };
}
