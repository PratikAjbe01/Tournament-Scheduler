// ============================================
// BRACKET MODEL (Optional but useful for rendering)
// ============================================
import mongoose from "mongoose";
const bracketSchema = new mongoose.Schema(
  {
    tournamentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tournament",
      required: true,
      unique: true,
    },
    // Store the bracket structure as JSON
    // Example: { round1: [matchId1, matchId2...], round2: [matchId3...] }
    structure: {
      type: Map,
      of: [mongoose.Schema.Types.ObjectId],
      default: new Map(),
    },
    // For quick lookup - which round is currently active
    activeRound: {
      type: Number,
      default: 1,
    },
    // Final winner team ID
    champion: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Team",
      default: null,
    },
  },
  { timestamps: true }
);

const Bracket = mongoose.model("Bracket", bracketSchema);
export default Bracket;