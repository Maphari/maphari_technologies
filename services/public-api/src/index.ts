import { createPublicApiApp } from "./app.js";

const app = await createPublicApiApp();
const port = Number(process.env.PORT ?? 4010);

app
  .listen({ port, host: "0.0.0.0" })
  .then(() => {
    app.log.info(`Public API service listening on :${port}`);
  })
  .catch((error) => {
    app.log.error(error);
    process.exit(1);
  });
