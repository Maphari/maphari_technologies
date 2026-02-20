import { createAnalyticsApp } from "./app.js";

const app = await createAnalyticsApp();
const port = Number(process.env.PORT ?? 4008);

app
  .listen({ port, host: "0.0.0.0" })
  .then(() => {
    app.log.info(`Analytics service listening on :${port}`);
  })
  .catch((error) => {
    app.log.error(error);
    process.exit(1);
  });
