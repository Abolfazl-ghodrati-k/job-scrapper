import { crawlGitLab } from "@/app/crawlers/gitlab";
import { crawlGlassDoor } from "@/app/crawlers/glassdoor";
import linkedIn from "@/app/crawlers/linkedin";
import { logger } from "@/app/utils/logger";
import moment from "moment";

const GetAll = async () => {
  const promises = [
    // crawlGlassDoor(),
    // linkedIn("React%Remote"),
    crawlGitLab(["Front End", "React", "Nextjs", "TypeScript", "Front-End", "frontend"])
  ];
  try {
    await Promise.all(promises);
  } catch (error) {
    console.log(error)
  }
};


export { GetAll }
