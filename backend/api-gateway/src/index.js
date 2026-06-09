const createApp = require("./app");
const config = require("./config");
const { checkConnection } = require("./db/pool");

async function start() {
  const app = createApp();

  const db = await checkConnection();
  if (!config.databaseUrl) {
    console.warn("DATABASE_URL is not set — database routes will fail until configured.");
  } else if (!db.ok) {
    console.warn(`Database connection failed: ${db.message || "unknown error"}`);
  } else {
    console.log("Database connection OK");
  }

  app.listen(config.port, () => {
    console.log(`API gateway listening on http://localhost:${config.port}`);
    console.log(`Health: http://localhost:${config.port}/health`);
    console.log(`API v1 status: http://localhost:${config.port}/api/v1/status`);
  });
}

start().catch((err) => {
  console.error(err);
  process.exit(1);
});
