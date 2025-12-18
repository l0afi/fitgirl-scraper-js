import axios from "axios";
import cheerio from "cheerio";
import pLimit from "p-limit";
import fs from "fs/promises";

const BASE_URL = "https://fitgirl-repacks.site/all-my-repacks-a-z/";
const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

// Stop after this many pages to prevent runaway crawling (set to null for unlimited)
const MAX_PAGES = null;
const CONCURRENCY = 3; // parallel page fetches
const SLEEP_MS = 800;  // small delay before each fetch to be polite
const OUTPUT_FILE = "entries.json";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function pageUrl(pageIndex) {
  return `${BASE_URL}?lcp_page0=${pageIndex}#lcp_instance_0`;
}

async function fetchHtml(url) {
  await sleep(SLEEP_MS);
  const res = await axios.get(url, {
    headers: { "User-Agent": USER_AGENT },
    timeout: 20000,
  });
  return res.data;
}

function parseList(html) {
  const $ = cheerio.load(html);
  const entries = [];
  $("ul.lcp_catlist#lcp_instance_0 > li").each((_, li) => {
    const a = $(li).find("a").first();
    const title = a.text().trim();
    const link = a.attr("href");
    if (title && link) entries.push({ title, link });
  });
  return entries;
}

async function scrapeAll() {
  const limit = pLimit(CONCURRENCY);
  const results = [];
  let page = 0;
  let keepGoing = true;
  const tasks = [];

  while (keepGoing) {
    if (MAX_PAGES !== null && page >= MAX_PAGES) break;

    const currentPage = page;
    tasks.push(
      limit(async () => {
        const url = pageUrl(currentPage);
        console.log(`Fetching page ${currentPage + 1}: ${url}`);
        try {
          const html = await fetchHtml(url);
          const entries = parseList(html);
          console.log(`  Page ${currentPage + 1} entries: ${entries.length}`);
          return { page: currentPage, entries };
        } catch (err) {
          console.error(`  Failed page ${currentPage + 1}:`, err.message);
          return { page: currentPage, entries: [], error: err };
        }
      })
    );

    // Process in batches of CONCURRENCY to detect empty pages early
    if (tasks.length >= CONCURRENCY) {
      const batch = await Promise.all(tasks.splice(0));
      batch.sort((a, b) => a.page - b.page);
      for (const { entries } of batch) results.push(...entries);
      const lastEmpty = batch.some((b) => b.entries.length === 0);
      if (lastEmpty) keepGoing = false;
    }

    page += 1;
  }

  // Drain remaining tasks
  const remaining = await Promise.all(tasks);
  remaining.sort((a, b) => a.page - b.page);
  for (const { entries } of remaining) results.push(...entries);
  if (remaining.some((b) => b.entries.length === 0)) keepGoing = false;

  return results;
}

async function main() {
  const entries = await scrapeAll();
  console.log(`\nTotal entries: ${entries.length}`);

  // Optional: dedupe by link
  const deduped = Array.from(
    new Map(entries.map((e) => [e.link, e])).values()
  );

  await fs.writeFile(OUTPUT_FILE, JSON.stringify(deduped, null, 2), "utf-8");
  console.log(`Saved ${deduped.length} entries to ${OUTPUT_FILE}`);
}

main().catch((err) => {
  console.error("Scrape failed:", err);
  process.exit(1);
});