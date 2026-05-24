#!/usr/bin/env node
import { fetchPR } from "./github";
import { analyzePR, formatMarkdown } from "./review";

async function main() {
  const args = process.argv.slice(2);
  let prUrl: string | undefined;

  // Parse --pr flag (accept both --pr=<url> and --pr <url>)
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg.startsWith("--pr=")) {
      prUrl = arg.slice(5);
    } else if (arg === "--pr" && i < args.length - 1) {
      prUrl = args[i + 1];
    } else if (arg.startsWith("http")) {
      prUrl = arg; // fallback: bare URL
    }
  }

  if (!prUrl) {
    console.error("Usage: claude-review --pr=<url>");
    console.error("Example: claude-review --pr=https://github.com/owner/repo/pull/123");
    process.exit(1);
  }

  const token = process.env.GITHUB_TOKEN;

  try {
    console.error("Fetching PR data...");
    const pr = await fetchPR(prUrl, token);

    console.error("Analyzing diff...");
    const review = analyzePR(pr);

    console.log(formatMarkdown(pr, review));
  } catch (err) {
    console.error(`Error: ${err instanceof Error ? err.message : err}`);
    process.exit(1);
  }
}

main();