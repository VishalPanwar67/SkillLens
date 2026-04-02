import "./loadEnv.js"; 
import { app } from "./server.js";
import connectMongoDB from "./db/connectMongoDB.js";

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
