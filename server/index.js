import express from "express";
import { connectDB } from "./db/database.js";
import { configDotenv } from "dotenv";
import userRoutes from "./routes/userRoutes.js";
import teamRoutes from "./routes/teamRoutes.js";
import teamRoutes from "./routes/tournamentRoutes.js";

configDotenv();
const app = express();

app.use(express.json());

// Routes
app.use("/api/users", userRoutes);
app.use("/api/teams", teamRoutes);
app.use("/api/tournament", tournamentRoutes);

connectDB();

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
