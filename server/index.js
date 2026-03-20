import { app } from "./server.js";
import dotenv from "dotenv";
import connectMongoDB from "./db/connectMongoDB.js";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, "config", ".env") });

const PORT = process.env.PORT || 5000;

// app.listen(PORT, () => {
//   console.log("Server started on port ", PORT);
// });

connectMongoDB()
  .then(() => {
    app.on("error", (error) => {
      console.log(`app is not able to connect :: ${error} 😭📉`);
      // Let Express/Middleware handle the error; crashing here is rarely desired.
    });
    app.listen(PORT, () => {
      console.log(`app is listening on port :: ${PORT} 💯📈`);
    });
  })
  .catch((error) => {
    console.log(`index.js :: connectDB connection failed  :: ${error} 😭📉`);
    process.exit(1);
  });
