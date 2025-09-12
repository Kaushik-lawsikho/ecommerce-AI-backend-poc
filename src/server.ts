import app from "./app";
import { AppDataSource } from "./config/datasource";

const port = process.env.PORT || 4000;

AppDataSource.initialize()
  .then(() => {
    console.log("DB connected");
    app.listen(port, () => console.log(`Server running on ${port}`));
  })
  .catch(err => {
    console.error("DB init error:", err);
  });
