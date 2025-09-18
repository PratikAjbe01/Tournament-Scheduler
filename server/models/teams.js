import mongoose from "mongoose";

const PlayerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  }
});


const TeamSchema = new mongoose.Schema({
  teamName: {
    type: String,
    required: [true, "Team name is required"],
    unique: true
  },
  departmentName: {
    type: String,
    required: true
  },
  players: [PlayerSchema],
  captain: {
    type: String,
    required: true,
    validate: {
      validator: function(captainName) {
        return this.players.some(player => player.name === captainName);
      },
      message: "Captain must be one of the players in the team"
    }
  },
  lastYearStatus: {
  type: String,
  enum: ["winner", "runnerup", "semi_winner", "semi_runner", "other"],
  default: "other"
}
},{ timestamps: true });
const Teams = mongoose.model("Team", TeamSchema);
export default Teams;