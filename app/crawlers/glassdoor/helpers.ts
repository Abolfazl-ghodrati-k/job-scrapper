import { Page } from "puppeteer";
import { checkAcceptCookies, saveCookies } from "./cookies";
import { logger } from "@/app/utils/logger";
import { sleep } from "@/app/utils/tools";

export async function isNotLoggedIn(page: Page) {
  const buttonExists = await page.evaluate((text) => {
    const button = Array.from(document.getElementsByTagName("button")).find(
      (b) => b.innerText === text
    );
    return !!button;
  }, "Sign In");

  return buttonExists;
}

export async function login(page: Page) {
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
  await page.click('button[data-test="email-form-button"]'); 
  await page.waitForSelector("#inlineUserPassword", { timeout: 60000 });
  await page.type("#inlineUserPassword", glassDoorPassword, {
    delay: 500,
  });
  await sleep(1000);
  await page.click('button[type="submit"]');

  await page.waitForSelector(
    'button[data-test="desktop-utility-nav-profile-button"]'
  );
  logger("Sigined In glassdoor successfully");
  await saveCookies(page);
}
