// ============================================
// TOURNAMENT MODEL
// ============================================
import mongoose from "mongoose";
const tournamentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Tournament name is required"],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
    },
    teams: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Team",
      },
    ],
    status: {
      type: String,
      enum: ["upcoming", "ongoing", "completed"],
      default: "upcoming",
    },
    currentRound: {
      type: Number,
      default: 1,
    },
    totalRounds: {
      type: Number,
      required: true,
    },
    totalTeams: {
      type: Number,
      required: true,
    },
    totalByes: {
      type: Number,
      default: 0,
    },
    // Teams that got bye (implicit, no match needed)
    teamsWithBye: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Team",
      },
    ],
    startDate: {
      type: Date,
      default: null,
    },
    endDate: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

const Tournament = mongoose.model("Tournament", tournamentSchema);
export default Tournament;