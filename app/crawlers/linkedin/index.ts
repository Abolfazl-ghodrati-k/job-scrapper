import Last from "@/app/models/Last";
import axios from "axios";
import cheerio, { load } from "cheerio";
import {
  getHashtags,
  sleep,
  convertStringToDateTime,
  locations,
  getTunnelProxy,
} from "../../utils/tools";
import util from "node:util";
import LanguageDetect from "languagedetect";
import { logger } from "@/app/utils/logger";
import { Agent } from "node:http";
import https from "node:https";
import Proxy from "@/app/models/Proxy";

const source = "LinkedIn";
const lngDetector = new LanguageDetect();
let tunnelingAgent: Agent | undefined;

axios.defaults.timeout = 30000;

const linkedIn = async (keyword: string) => {
  logger(`Linkedin Process started at ${keyword}`);
  
  tunnelingAgent = await getTunnelProxy()
  // try {
  //   let jobs: any[] = [];
  //   for (let location of locations) {
  //     let linkedInLink = util.format(
  //       process.env.LINKEDIN_ENDPOINT,
  //       keyword,
  //       location.name
  //     );
  //     let html = await axios.get(linkedInLink, {
  //       proxy: false,
  //       httpsAgent: tunnelingAgent,
  //     });
  //     await sleep(5000);
  //     const $ = load(html.data);
  //     const jobsList = $(".jobs-search__results-list").children();
  //     for (let job of jobsList) {
  //       const title = $(job).find(".base-search-card__title").text().trim();
  //       const company = $(job)
  //         .find(".base-search-card__subtitle")
  //         .text()
  //         .trim();
  //       const when = $(job).find("time").text().trim();
  //       const location = $(job)
  //         .find(".job-search-card__location")
  //         .text()
  //         .trim();
  //       const url = $(job).find("a").attr("href");
  //       // const guid = $(job).find('div.base-card').attr('data-entity-urn');
  //       const guid = company + title;
  //       const exist = await Last.findOne({
  //         where: source,
  //         guid: guid,
  //       });
  //       if (guid && !exist) {
  //         // await new Last({
  //         //   where: source,
  //         //   guid: guid,
  //         // }).save();

  //         if (url) {
  //           const { content, isEnglish, fullContent } = await getJobContent(
  //             url
  //           );
  //           let hashtags = getHashtags(fullContent);
  //           hashtags.push(keyword);
  //           if (isEnglish) {
  //             jobs.push({
  //               title,
  //               company,
  //               location,
  //               content,
  //               url,
  //               hashtags,
  //               options: null,
  //               source,
  //               when: convertStringToDateTime(when),
  //             });
  //           }
  //         }

  //         await sleep(10000);
  //       }
  //     }
  //   }

  //   return jobs;
  // } catch (err) {
  //   logger(`LinkedIn Error: ${err} `);
  //   return [];
  // }
};

async function getJobContent(url: string) {
  let html = await axios.get(url, {
    proxy: false,
    httpsAgent: tunnelingAgent,
  });
  const $ = load(html.data);
  let content = $(".show-more-less-html__markup").text().trim();
  let shortContent = content.slice(0, 150);

  return {
    content: shortContent + "...",
    fullContent: content,
    isEnglish:
      lngDetector.detect(shortContent, 1).length > 0
        ? lngDetector.detect(shortContent, 1)[0][0] == "english"
        : false,
  };
}

export default linkedIn;
