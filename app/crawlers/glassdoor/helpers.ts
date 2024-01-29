import { Page } from "puppeteer";

export async function isNotLoggedIn(page: Page) {
  const buttonExists = await page.evaluate((text) => {
    const button = Array.from(document.getElementsByTagName("button")).find(
      (b) => b.innerText === text
    );
    return !!button;
  }, "Sign In");

  return buttonExists;
}
