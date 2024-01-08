import { launchBrowser } from "@/app/crawlers/glassdoor";
import { connect } from "@/app/utils/db";
import { logger } from "@/app/utils/logger";
import { GetAll } from "./AIO";

export const dynamic = 'force-dynamic'
export async function GET(request: Request) {
  await launchBrowser();
  await connect();

  if (process.env.UPDATE_DB === "true") {
    const result = await GetAll();
    logger("DB Update has finished successfully, results:");
    logger(JSON.stringify(result));
  }
  return Response.json({ message: "request recieved, connected to db" });
}
