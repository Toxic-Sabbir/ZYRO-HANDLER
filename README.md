# 🧩 ST-Handlers

> Centralized handler repository for **[ST-BOT](https://github.com/sheikhtamimlover/ST-BOT)** —  
> a modular storage system for all **commands**, **events**, and **API handlers** used by the bot.

---

## 📦 Overview

**ST-Handlers** is the companion repository for **ST-BOT**, maintained by **Dabbir Hossain**.
It serves as a **modular storage hub**, containing all the building blocks that power the bot’s runtime behavior — such as:

- 🔹 Commands (`commands`)
- 🔹 Events (`events`)
- 🔹 API Handlers (`api`)
- 🔹 Utilities or middleware (optional)

This modular separation helps keep **ST-BOT** lightweight and allows hot updates or remote fetch of modules without redeploying the bot core.

---

## 🗂 Folder Structure

```bash
ST-Handlers/
│
├── commands/      # All bot commands (.js files)
│   ├── fun/
│   ├── tools/
│   ├── ai/
│   └── system/
│
├── events/        # Messenger event handlers (e.g., message, react, join)
│   ├── onMessage.js
│   ├── onReact.js
│   └── onJoin.js
│
├── api/           # Web or internal API endpoints for dashboard or modules
│   ├── dashboard.js
│   └── stats.js
│
└── README.md
```

## Deploy on Render

This repository now includes a read-only catalog API for browsing command categories and API module names. It does not execute the bot handlers or expose their source code. The catalog is a metadata service; deploying it does not run the ST-BOT bot.

1. Push this repository to GitHub, then in Render select **New > Blueprint** and connect the repository. Render will read `render.yaml` and create the web service.
2. The Blueprint runs `npm install --omit=dev && npm test`, starts the API with `npm start`, and uses `/health` for health checks. No secret environment variables are needed for the catalog.
3. After deployment, use the service's Render URL with the endpoints below.

| Endpoint | Purpose |
| --- | --- |
| `GET /health` | Service health status |
| `GET /api/v1` | List available endpoints |
| `GET /api/v1/categories` | Command categories and counts |
| `GET /api/v1/commands` | All command names and categories |
| `GET /api/v1/commands?category=fun` | Commands in one category; URL-encode category names containing spaces |
| `GET /api/v1/api-modules` | API module names; these are source modules, not callable endpoints |

The API returns JSON metadata only. Do not publish this repository as a static site: it contains credential-named JSON files and handler source code. The separate ST-BOT runtime must still be deployed as a Background Worker if you want the bot itself to run.

#### Pre-deploy code check

The catalog API has a test command, but it does not test whether every source handler works. A JavaScript syntax check is also only a first-pass check. Run this from the repository root:

```sh
find . -type f -name '*.js' -not -path './.git/*' -print0 | xargs -0 -n1 node --check
```

In the current audit, 426 of 436 JavaScript files passed and 10 failed. Five API files fail on duplicate `axios` declarations: `api/aiemojimaker.js`, `api/fluxpro.js`, `api/iemoji.js`, `api/logogen.js`, and `api/vidGen.js`. The other failures include malformed JavaScript or files containing command/log output rather than JavaScript: `others/autodl.js`, `others/code_2.js`, `others/js/1.js`, `others/js/fuck.js`, and `others/resend.js`. These issues do not prevent the catalog API from listing files because it does not load or execute handler modules. Resolve them before treating the bot handlers as deploy-ready, then run the ST-BOT runtime's tests and check its Render logs.

### Credential safety

Before deploying or making this repository public, review tracked credentials such as `key.json`, `shazamkey.json`, and `stfcakey.json`, as well as API keys embedded in source files. Remove secrets from the repository, rotate any exposed keys, and provide replacement values through the runtime host's secret environment variables. Removing a file in a new commit does not remove it from Git history.
