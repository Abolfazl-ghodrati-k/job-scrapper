import puppeteer, { Browser, ElementHandle, Mouse, Page } from "puppeteer";
import moment from "moment";
import LanguageDetect from "languagedetect";
import { getHashtags, sleep, locations } from "@/app/utils/tools";
import { logger } from "@/app/utils/logger";
import Last from "@/app/models/Last";
import { JobDoc as Job } from "../../models/Job";
import {
  checkAcceptCookies,
  saveCookies,
  setCookies,
  setLocalStorage,
} from "./cookies";
import { isNotLoggedIn } from "./helpers";
import { checkForCaptcha, solveCaptcha } from "./captcha";

const lngDetector = new LanguageDetect();

var initPage: Page | null = null;

const source = "glassdoor";
const glassdoorURL = "https://www.glassdoor.com";
const IS_PRODUCTION = process.env.NODE_ENV === "production";
let browser: Browser;

// TYPEs ----------------------------------------------------------

const launchBrowser = async () => {
  logger("Launching Browser");

  // const browser =
  // await puppeteer.connect({
  //   browserWSEndpoint: `wss://job-finder-chrome.liara.run/?token=${process.env.BLESS_TOKEN}`,
  // });
  browser = await puppeteer.launch({
    headless: false,
    protocolTimeout: 500000,
  }); // Run the browser locally while in development

  initPage = await browser.newPage();
  await initPage.setCacheEnabled(false);
  logger(`Browser Launched Successfully!: ${browser.isConnected()}`);
};

const crawlGlassDoor = async (): Promise<Job[]> => {
  if (!initPage) {
    throw new Error("Pupeteer not working");
  }
  await setCookies(initPage);

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
    try {
      await searchJobs(page, locations[i].id);
    } catch (error) {
      logger(`error in search jobs function in glassdoor`);
      return jobs;
    }
    jobs.push(...(await parsePageJobs(page, locations[i].name)));
    await sleep(3000);
  }
  return jobs;
};

const gotToGlassDoor = async (page: Page) => {
  logger("opening glassdoor ...");
  await page.goto("https://www.glassdoor.com", { timeout: 120000 });
  logger("trying to see if there is a capchta");
  const hasCaptcha = await checkForCaptcha(page);
  if (hasCaptcha) {
    logger("Detected Captcha on glassdoor when openning");
    return;
    // await solveCaptcha(page);
  }
  await sleep(5000);
  const checkAgainForCaptcha = await checkForCaptcha(page);
  if (checkAgainForCaptcha) {
    logger("captcha is a bitch");
    return;
  }

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

async function login(page: Page) {
  //Sometimes need to click on Accept Cookies button
  await checkAcceptCookies(page);
  logger("logging in glassdoor");

  await page.click(".email-input");

  const glassDoorUserName = process.env.GLASSDOOR_USERNAME;
  const glassDoorPassword = process.env.GLASSDOOR_PASS;
  if (!glassDoorPassword || !glassDoorUserName) {
    logger("No glassdoor password or username found in .env");
    return;
  }

  await page.type("#inlineUserEmail", glassDoorUserName, {
    delay: 500,
  });
  await sleep(1000);
  await page.click('button[data-test="email-form-button"]'); //click on continue with email button
  // await page.screenshot({ path: path.resolve(storageFolder, 'inlineUserPassword.png') }
  await page.waitForSelector("#inlineUserPassword", { timeout: 60000 });
  await page.type("#inlineUserPassword", glassDoorPassword, {
    delay: 500,
  });
  await sleep(1000);
  await page.click('button[type="submit"]'); //click on Sign In button

  await page.waitForSelector(
    'button[data-test="desktop-utility-nav-profile-button"]'
  );
  logger("Sigined In glassdoor successfully");
  await saveCookies(page);
}

async function searchJobs(page: Page, locationId: number) {
  let jobsLink = `https://www.glassdoor.com/Job/jobs.htm?sc.keyword=react%20developer%20remote&locT=N&locId=${locationId}`;

  logger(`Searching for jobs in glassdoor: ${locationId}`);
  await page.goto(jobsLink, { timeout: 120000 });
  // const hasCaptcha = await checkForCaptcha(page);
  // if (hasCaptcha) {
  //   logger("Captcha found in seraching job for glassdoor");
  //   return;
  //   // await solveCaptcha(page);
  // }

  // const checkAgainForCaptcha = await checkForCaptcha(page)
  // if(checkAgainForCaptcha) {
  //   logger('captcha is a bitch in searching')
  //   return
  // }
  // wait for Posted time div

  const finalUrl = page.url();
  const newUrl = finalUrl + "&fromAge=30";
  await page.goto(newUrl, { timeout: 120000 });
}

async function parsePageJobs(page: Page, country: string) {
  let jobs = [];
  const listItems = await page.$$(`li[data-test="jobListing"]`);
  let today = moment().format("YYYY-MM-DD");

  for (const listItem of listItems) {
    try {
      await sleep(3000 + Math.random() * 600);
      const { location, url, company, title } = await listItem.evaluate(
        (element: Element) => {
          logger(`${location + title}`);
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

      // Uncomment the following block if you want to save to the database
      // if (guid && !exist) {
      //   await new Last({
      //     where: source,
      //     guid: guid,
      //   }).save();
      // }

      logger(`new job ${title}`)

      const { content, isEnglish } = await getJobContent(page, listItem);
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
    } catch (error) {
      // Log the error and continue to the next iteration
      logger(`Error processing job: ${error}`);
    }
  }

  return jobs;
}

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
