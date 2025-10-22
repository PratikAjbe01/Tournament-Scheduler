// ============================================
// MATCH MODEL
// ============================================
import mongoose from "mongoose";
const matchSchema = new mongoose.Schema(
  {
    tournamentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tournament",
      required: true,
    },
    round: {
      type: Number,
      required: true,
    },
    matchNumber: {
      type: Number,
      required: true,
    },
    team1: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Team",
      default: null,
    },
    team2: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Team",
      default: null,
    },
    winner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Team",
      default: null,
    },
    loser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Team",
      default: null,
    },
    status: {
      type: String,
      enum: ["pending", "completed"],
      default: "pending",
    },
    matchTime: {
      type: Date,
      default: null,
    },
    venue: {
      type: String,
      default: null,
    },
    // Reference to next round match where winner advances
    nextMatchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Match",
      default: null,
    },
    // Which slot in the next match (team1 or team2)
    nextMatchSlot: {
      type: String,
      enum: ["team1", "team2"],
      default: null,
    },
  },
  { timestamps: true }
);

const Match = mongoose.model("Match", matchSchema);
export default Match;