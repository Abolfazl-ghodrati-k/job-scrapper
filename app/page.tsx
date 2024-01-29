import { GetAll } from "./api/crawl/AIO";
import { launchBrowser } from "./crawlers/glassdoor";
import { connect } from "./utils/db";
import { logger } from "./utils/logger";
import { runCrawler } from "./utils/tools";

export const dynamic = 'force-dynamic';

export default async function Home() {
  await runCrawler();
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      Welcome buddy
    </main>
  );
}
