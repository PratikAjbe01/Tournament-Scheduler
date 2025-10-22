// ============================================
// TEAM MODEL
// ============================================
import mongoose from "mongoose";


const teamSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Team name is required"],
      trim: true,
    },
    logo: {
      type: String,
      default: null,
    },
    description: {
      type: String,
      trim: true,
    },
    tournamentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tournament",
      required: true,
    },
    // Previous year's standing (for seeding)
    previousStanding: {
      type: String,
      enum: ["winner", "runnerUp", "semiFinalist1", "semiFinalist2", "none"],
      default: "none",
    },
  },
  { timestamps: true }
);

const Team = mongoose.model("Team", teamSchema);
export default Team;