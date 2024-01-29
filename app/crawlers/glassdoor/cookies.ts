import { logger } from "@/app/utils/logger";
import { Page } from "puppeteer";
import path from "path";
import { promises as fs } from "fs";
const storageFolder = `${__dirname}/storage`;


export async function setCookies(page: Page) {
  try {
    const cookiesBuffer = await fs.readFile(
      path.resolve(storageFolder, "cookies.json")
    );
    const cookiesString = cookiesBuffer.toString();
    const cookiesObj = JSON.parse(cookiesString);
    await page.setCookie(...cookiesObj);
    logger(`Cookies file added successfully`);
  } catch (err) {
    logger(`Cannot access cookies file`);
  }
}

export async function setLocalStorage(page: Page) {
  try {
    const localStorageBuffer = await fs.readFile(
      path.resolve(storageFolder, "localStorage.json")
    );
    const localStorageString = localStorageBuffer.toString();
    const localStorageObj = JSON.parse(localStorageString);
    await page.evaluate((localStorageObj) => {
      for (const key in localStorageObj) {
        localStorage.setItem(key, localStorageObj[key]);
      }
    }, localStorageObj);
    console.log(`LocalStorage file added successfully`);
  } catch {
    console.log(`Cannot access LocalStorage file`);
  }
}

export async function saveCookies(page: Page) {
  logger(`saving cookies to ${storageFolder}`)
  await fs.mkdir(storageFolder, { recursive: true });
  const cookies = await page.cookies();
  await fs.writeFile(
    path.resolve(storageFolder, "cookies.json"),
    JSON.stringify(cookies, null, 2)
  );
  const localStorageData = await page.evaluate(() =>
    Object.assign({}, window.localStorage)
  );
  await fs.writeFile(
    path.resolve(storageFolder, "localStorage.json"),
    JSON.stringify(localStorageData, null, 2)
  );
  console.log(`Cookies saved`);
}

export async function checkAcceptCookies(page: Page) {
  const buttonExists = await page.evaluate((text) => {
    const button = Array.from(document.getElementsByTagName("button")).find(
      (b) => b.innerText === text
    );
    return !!button;
  }, "Accept Cookies");

  if (buttonExists) {
    logger("cookies button watched");
    await page.evaluate((text) => {
      const button = Array.from(document.getElementsByTagName("button")).find(
        (b) => b.innerText === text
      )!;
      button.click();
    }, "Accept Cookies");
  }
}
