import app from "./app";
import { AppDataSource } from "./config/datasource";
import logger, { eventLogger, errorLogger } from "./config/logger";

const port = process.env.PORT || 4000;

AppDataSource.initialize()
  .then(() => {
    eventLogger("database_connected", { port: process.env.DB_PORT || 5432 });
    app.listen(port, () => {
      eventLogger("server_started", { port, environment: process.env.NODE_ENV || 'development' });
    });
  })
  .catch(err => {
    errorLogger(err, { context: "database_initialization" });
    process.exit(1);
  });
