import express from "express";
import cors from 'cors';
import dotenv from 'dotenv'
import connectDB from './db/database.js';
import cookieParser from "cookie-parser";
import adminAuthRouter from "./routes/admin.js";
import eventrouter from "./routes/event.js";
import tournamentRouter from './routes/tournament.js';
import teamRouter from './routes/team.js';
import matchRouter from './routes/match.js';
import bracketRouter from './routes/bracket.js';
dotenv.config();
const app = express();
const PORT=process.env.PORT||3000;
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
  })
);
app.use(express.json());
app.use(cookieParser());
connectDB();
app.use("/api/users", adminAuthRouter);
app.use("/api/events",eventrouter);
app.use('/api/tournaments', tournamentRouter);
app.use('/api/teams', teamRouter);
app.use('/api/matches', matchRouter);
app.use('/api/brackets', bracketRouter);


app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
