import dotenv from "dotenv";
dotenv.config();

import connectDB from "./src/config/db.js";
import app from "./src/app.js";

connectDB();

const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`server is running on port ${port}`);
});
