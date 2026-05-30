# Weekly Dev Summary n8n Workflow

Automated weekly developer summary generator using n8n, GitHub API, MiniMax Text-01, and Discord webhooks.

## Features

- ⏰ **Cron trigger** every Friday at 5:00 PM (`0 17 * * 5`)
- 📊 Fetches **commits**, **closed issues**, and **merged PRs** from the past week
- 🤖 Generates summary via **MiniMax Text-01** AI
- 📢 Delivers to **Discord** via webhook
- 🌐 Supports **EN** or **FR** language output

## Setup (5 Steps)

### Step 1: Import Workflow
1. Open n8n at `http://localhost:5673` (or your n8n instance)
2. Click **Workflows** → **Import from File**
3. Select `weekly-dev-summary.json`

### Step 2: Configure Variables
In the workflow variables panel, set:
- `github_repo` — e.g., `claude-builders-bounty/claude-builders-bounty`
- `discord_webhook_url` — your Discord webhook URL
- `language` — `EN` or `FR`
- `GITHUB_TOKEN` — GitHub Personal Access Token

### Step 3: Set Environment Variable
In your n8n environment variables (or `.env` file), add:
```
MINIMAX_CN_API_KEY=your_minimax_api_key_here
```

### Step 4: Activate Workflow
Toggle the workflow **Active** switch to enable the Friday 5pm trigger.

### Step 5: Test
Click **Test Workflow** to verify all nodes execute correctly.

## Workflow Structure

```
Schedule (Fri 5pm)
    ↓
Date Helper → Calculate 7 days ago
    ↓
    ├──→ GitHub API: Commits ──┐
    ├──→ GitHub API: Issues  ──┼→ Merge Data → MiniMax API → Discord Webhook
    └──→ GitHub API: PRs     ──┘
```

## System Prompt

> "You are a senior developer writing concise weekly dev summaries in the target language (EN/FR). Generate a structured summary covering: completed features, bug fixes, notable commits, blockers, and next week's priorities. Keep it under 400 words."

## Files

- `weekly-dev-summary.json` — Importable n8n workflow
- `README.md` — This file