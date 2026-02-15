import { app } from "./server.js";
import dotenv from "dotenv";

dotenv.config({ path: "./backend/config/.env" });

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log("Server started on port ", PORT);
});
