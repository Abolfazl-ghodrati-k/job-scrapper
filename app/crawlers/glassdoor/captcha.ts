import { logger } from "@/app/utils/logger";
import { sleep } from "@/app/utils/tools";
import { Mouse, Page } from "puppeteer";

export const checkForCaptcha = async (page: Page) => {
    // Adjust this selector based on the elements commonly associated with captchas
    const pageContent = await page.content();
  
    try {
      // Check if the captcha element is present on the page
      const captchaTextExists = pageContent.includes('Help Us Protect Glassdoor');
  
      if (captchaTextExists) {
        logger("Captcha detected!");
        return true;
      } else {
        logger("No captcha found.");
        return false;
      }
    } catch (error) {
      logger(`Error checking for captcha: ${error}`);
      return false;
    }
  };

export const solveCaptcha = async (page: Page) => {
  const mouse = page.mouse;
  let currentPosition = { x: 0, y: 0 }; // Initialize the posit

  try {
    const captchaCheckbox = await page.evaluate(() => {
      const checkbox = document.querySelector("input[type='checkbox']");
      const rect = checkbox?.getBoundingClientRect()!;
      return {
        x: rect.left + window.pageXOffset,
        y: rect.top + window.pageYOffset,
      };
    });

    currentPosition = await moveToWithRandomSpeed(
      mouse,
      currentPosition,
      captchaCheckbox,
      10
    );
    await sleep(2000);
    await mouse.click(currentPosition.x, currentPosition.y);
    logger("Captcha captchered and solved");
  } catch (error) {
    throw new Error("Captcha input not found");
  }
};

export const moveToWithRandomSpeed = async (
  mouse: Mouse,
  currentPosition: {
    x: number;
    y: number;
  },
  targetPosition: {
    x: number;
    y: number;
  },
  steps: number
) => {
  for (let i = 0; i <= steps; i++) {
    const deltaX = (targetPosition.x - currentPosition.x) / steps;
    const deltaY = (targetPosition.y - currentPosition.y) / steps;

    currentPosition.x += deltaX;
    currentPosition.y += deltaY;

    await mouse.move(currentPosition.x, currentPosition.y);
    await sleep(Math.random() * (300 - 100) + 100); // Random pause between 100ms and 300ms
  }

  return currentPosition;
};
