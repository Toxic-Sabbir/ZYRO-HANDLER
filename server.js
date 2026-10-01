const fs = require("node:fs");
const http = require("node:http");
const path = require("node:path");

const commandDirectory = path.join(__dirname, "commands");
const apiDirectory = path.join(__dirname, "api");

function readJavaScriptFiles(directory) {
  return fs.readdirSync(directory, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(".js"))
    .map((entry) => entry.name);
}

function createCatalog() {
  const categories = fs.readdirSync(commandDirectory, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => {
      const commands = readJavaScriptFiles(path.join(commandDirectory, entry.name))
        .sort((left, right) => left.localeCompare(right))
        .map((file) => ({
          name: file.slice(0, -3),
          file,
          category: entry.name,
        }));

      return { name: entry.name, commands };
    })
    .sort((left, right) => left.name.localeCompare(right.name));

  const apiModules = readJavaScriptFiles(apiDirectory)
    .sort((left, right) => left.localeCompare(right))
    .map((file) => ({ name: file.slice(0, -3), file }));

  return { categories, apiModules };
}

function sendJson(response, statusCode, data) {
  response.writeHead(statusCode, {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json; charset=utf-8",
  });
  response.end(JSON.stringify(data));
}

function createServer() {
  const catalog = createCatalog();

  return http.createServer((request, response) => {
    if (request.method === "OPTIONS") {
      response.writeHead(204, {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      });
      response.end();
      return;
    }

    if (request.method !== "GET") {
      sendJson(response, 405, { error: "Method not allowed" });
      return;
    }

    const requestUrl = new URL(request.url, "http://localhost");
    const { pathname, searchParams } = requestUrl;

    if (pathname === "/health") {
      sendJson(response, 200, { status: "ok" });
      return;
    }

    if (pathname === "/api/v1") {
      sendJson(response, 200, {
        endpoints: [
          "GET /health",
          "GET /api/v1/categories",
          "GET /api/v1/commands",
          "GET /api/v1/commands?category=<category>",
          "GET /api/v1/api-modules",
        ],
      });
      return;
    }

    if (pathname === "/api/v1/categories") {
      sendJson(response, 200, catalog.categories.map(({ name, commands }) => ({
        name,
        commandCount: commands.length,
      })));
      return;
    }

    if (pathname === "/api/v1/commands") {
      const categoryName = searchParams.get("category");
      if (categoryName !== null) {
        const category = catalog.categories.find(({ name }) => name === categoryName);
        if (!category) {
          sendJson(response, 404, { error: "Category not found" });
          return;
        }
        sendJson(response, 200, {
          category: category.name,
          total: category.commands.length,
          commands: category.commands,
        });
        return;
      }

      const commands = catalog.categories.flatMap(({ commands: categoryCommands }) => categoryCommands);
      sendJson(response, 200, { total: commands.length, commands });
      return;
    }

    if (pathname === "/api/v1/api-modules") {
      sendJson(response, 200, { total: catalog.apiModules.length, modules: catalog.apiModules });
      return;
    }

    sendJson(response, 404, { error: "Not found" });
  });
}

if (require.main === module) {
  const port = Number(process.env.PORT) || 3000;
  createServer().listen(port, "0.0.0.0", () => {
    console.log(`Handler catalog API listening on port ${port}`);
  });
}

module.exports = { createServer };