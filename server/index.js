import express from "express";
import { connectDB } from "./db/database.js";
import { configDotenv } from "dotenv";
configDotenv();
import userRoutes from "./routes/userRoutes.js";

const app = express();

app.use(express.json());
app.use("/api/users", userRoutes);

connectDB();
const PORT = 5000||process.env.PORT;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));