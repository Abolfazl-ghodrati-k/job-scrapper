import puppeteer, { Browser, Page } from "puppeteer";
import { logger } from "../utils/logger";
let browser: Browser;

const launchBrowser = async () => {
  logger("Launching Browser");
  if (!browser) {
    browser = await puppeteer.launch({
      headless: false,
      protocolTimeout: 500000,
      executablePath: process.env.CHROME_EXECUTABLE_PATH,
    });
  }

  logger(`Browser Launched Successfully!`);
  return browser;
};

export { launchBrowser };
