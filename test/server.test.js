const assert = require("node:assert/strict");
const { after, before, test } = require("node:test");
const { createServer } = require("../server");

let server;
let baseUrl;

before(async () => {
  server = createServer();
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  await new Promise((resolve, reject) => {
    server.close((error) => error ? reject(error) : resolve());
  });
});

test("serves health, category, command, and API-module catalogs", async () => {
  const healthResponse = await fetch(`${baseUrl}/health`);
  assert.equal(healthResponse.status, 200);
  assert.deepEqual(await healthResponse.json(), { status: "ok" });

  const indexResponse = await fetch(`${baseUrl}/api/v1`);
  const index = await indexResponse.json();
  assert.equal(indexResponse.status, 200);
  assert.ok(index.endpoints.includes("GET /api/v1/categories"));

  const categoriesResponse = await fetch(`${baseUrl}/api/v1/categories`);
  const categories = await categoriesResponse.json();
  assert.equal(categoriesResponse.status, 200);
  assert.ok(categories.some(({ name }) => name === "fun"));

  const allCommandsResponse = await fetch(`${baseUrl}/api/v1/commands`);
  const allCommands = await allCommandsResponse.json();
  assert.equal(allCommandsResponse.status, 200);
  assert.equal(allCommands.total, allCommands.commands.length);

  const commandsResponse = await fetch(`${baseUrl}/api/v1/commands?category=fun`);
  const commands = await commandsResponse.json();
  assert.equal(commandsResponse.status, 200);
  assert.equal(commands.category, "fun");
  assert.ok(commands.commands.every(({ category }) => category === "fun"));
  assert.deepEqual(Object.keys(commands.commands[0]).sort(), ["category", "file", "name"]);

  const modulesResponse = await fetch(`${baseUrl}/api/v1/api-modules`);
  const modules = await modulesResponse.json();
  assert.equal(modulesResponse.status, 200);
  assert.ok(modules.total > 0);
  assert.ok(modules.modules.some(({ name }) => name === "chat"));
  assert.deepEqual(Object.keys(modules.modules[0]).sort(), ["file", "name"]);
});

test("returns JSON errors for unknown categories and routes", async () => {
  const categoryResponse = await fetch(`${baseUrl}/api/v1/commands?category=missing`);
  assert.equal(categoryResponse.status, 404);
  assert.deepEqual(await categoryResponse.json(), { error: "Category not found" });

  const routeResponse = await fetch(`${baseUrl}/not-an-endpoint`);
  assert.equal(routeResponse.status, 404);
  assert.deepEqual(await routeResponse.json(), { error: "Not found" });
});

test("supports CORS preflight requests", async () => {
  const response = await fetch(`${baseUrl}/api/v1/categories`, { method: "OPTIONS" });
  assert.equal(response.status, 204);
  assert.equal(response.headers.get("access-control-allow-origin"), "*");
  assert.equal(await response.text(), "");
});