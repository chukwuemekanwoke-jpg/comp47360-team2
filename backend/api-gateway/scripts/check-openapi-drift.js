const fs = require("fs");
const path = require("path");
const yaml = require("js-yaml");

const SPEC_PATH = path.join(__dirname, "../../../docs/architecture/openapi-v0.yaml");

function leafRoutes(router) {
  return router.stack
    .filter((layer) => layer.route)
    .flatMap((layer) => {
      const methods = Object.keys(layer.route.methods).filter((m) => m !== "_all");
      return methods.map((method) => ({
        method: method.toUpperCase(),
        expressPath: layer.route.path,
      }));
    });
}

function toOpenApiPath(expressPath) {
  return expressPath.replace(/:([A-Za-z0-9_]+)/g, "{$1}");
}

function collectCodeRoutes() {
  const healthRouter = require("../src/routes/health");
  const apiV1Router = require("../src/routes/apiV1");
  const authRouter = require("../src/routes/apiV1/auth");
  const usersRouter = require("../src/routes/apiV1/users");
  const restaurantsRouter = require("../src/routes/apiV1/restaurants");
  const bookingsRouter = require("../src/routes/apiV1/bookings");
  const offersRouter = require("../src/routes/apiV1/offers");
  const campaignsRouter = require("../src/routes/apiV1/campaigns");
  const restaurantBookingsRouter = require("../src/routes/apiV1/restaurantBookings");

  const mounts = [
    { prefix: "/health", router: healthRouter },
    { prefix: "/api/v1", router: apiV1Router },
    { prefix: "/api/v1/auth", router: authRouter },
    { prefix: "/api/v1/users", router: usersRouter },
    { prefix: "/api/v1/restaurants", router: restaurantsRouter },
    { prefix: "/api/v1/bookings", router: bookingsRouter },
    { prefix: "/api/v1/offers", router: offersRouter },
    { prefix: "/api/v1/restaurants/{restaurantId}/campaigns", router: campaignsRouter },
    { prefix: "/api/v1/restaurants/{restaurantId}/bookings", router: restaurantBookingsRouter },
  ];

  const routes = new Set();
  for (const { prefix, router } of mounts) {
    for (const { method, expressPath } of leafRoutes(router)) {
      const suffix = expressPath === "/" ? "" : toOpenApiPath(expressPath);
      routes.add(`${method} ${prefix}${suffix}`);
    }
  }
  return routes;
}

function collectSpecRoutes() {
  const spec = yaml.load(fs.readFileSync(SPEC_PATH, "utf8"));
  const routes = new Set();
  for (const [specPath, operations] of Object.entries(spec.paths)) {
    for (const method of Object.keys(operations)) {
      if (["get", "post", "put", "patch", "delete"].includes(method)) {
        routes.add(`${method.toUpperCase()} ${specPath}`);
      }
    }
  }
  return routes;
}

function main() {
  const codeRoutes = collectCodeRoutes();
  const specRoutes = collectSpecRoutes();

  const missingInCode = [...specRoutes].filter((r) => !codeRoutes.has(r)).sort();
  const missingInSpec = [...codeRoutes].filter((r) => !specRoutes.has(r)).sort();

  if (missingInCode.length === 0 && missingInSpec.length === 0) {
    console.log(`OpenAPI drift check passed (${specRoutes.size} routes in sync).`);
    return;
  }

  if (missingInCode.length > 0) {
    console.error("Endpoints declared in docs/architecture/openapi-v0.yaml but not implemented in code:");
    missingInCode.forEach((r) => console.error(`  - ${r}`));
  }
  if (missingInSpec.length > 0) {
    console.error("Endpoints implemented in code but not declared in docs/architecture/openapi-v0.yaml:");
    missingInSpec.forEach((r) => console.error(`  - ${r}`));
  }
  process.exitCode = 1;
}

main();
