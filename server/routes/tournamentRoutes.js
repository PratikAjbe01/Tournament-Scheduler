import express from "express";
import * as tournamentController from "../controllers/tournamentController.js";

const router = express.Router();

// Routes
router.post("/", tournamentController.createTournament);
router.put("/:id", tournamentController.updateTournament);
router.delete("/:id", tournamentController.deleteTournament);
router.get("/get/:id", tournamentController.getTournamentInfo);
router.get("/getAll", tournamentController.allTournaments);

export default router;