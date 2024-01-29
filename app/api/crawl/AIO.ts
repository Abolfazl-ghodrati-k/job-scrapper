import { crawlGlassDoor } from "@/app/crawlers/glassdoor";
import { logger } from "@/app/utils/logger";
import moment from "moment";

const GetAll = async () => {
  const promises = [crawlGlassDoor()];
  try {
    let result = await Promise.all(promises);
    
    return result;
  } catch (error) {
    logger(JSON.stringify(error));
  }
};


export { GetAll }
