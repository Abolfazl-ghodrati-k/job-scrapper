async function runCrawler() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/crawl`, { next: { revalidate: 0 } });
  const response = await res.json();
  console.log(response)
}

export default async function Home() {
  await runCrawler();
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      Welcome buddy
    </main>
  );
}
