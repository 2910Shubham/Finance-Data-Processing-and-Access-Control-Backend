import dotenv from "dotenv";
dotenv.config();
import express from "express";
import connectDB from "./src/config/db.js";

const app = express();

connectDB()

app.use(express.json());

app.listen(process.env.PORT || 5000, () => {
    console.log(`server is running on port ${process.env.PORT || 5000 }`)
});