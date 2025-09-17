import express from "express";
import * as teamController from "../controllers/teamController.js";

const router = express.Router();

// Routes
router.post("/", teamController.createTeam);
router.put("/:id", teamController.updateTeam);
router.delete("/:id", teamController.deleteTeam);
router.get("/get/:id",teamController.getTeamInfo);
router.get("/getAll",teamController.allTeams);
export default router;
