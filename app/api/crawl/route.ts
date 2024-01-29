import { launchBrowser } from "@/app/crawlers";
import { connect } from "@/app/utils/db";
import { logger } from "@/app/utils/logger";
import { GetAll } from "./AIO";
import { runCrawler } from "@/app/utils/tools";

export async function GET(request: Request) {
 await runCrawler()
  return Response.json({ message: "request recieved, connected to db" });
}
