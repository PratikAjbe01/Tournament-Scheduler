// models/Schedule.js
const mongoose = require("mongoose");

const ScheduleSchema = new mongoose.Schema({
 round: {
    type: Number,
    required: true
  },
  matchNumber: {
    type: Number,
    required: true
  },
  team1: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Team",
    required: false
  },
  team2: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Team",
    required: false
  },
  isByeMatch: {
    type: Boolean,
    default: false
  },
  winner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Team",
    default: null
  },
  tournament: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Tournament"
  }
}, { timestamps: true });

module.exports = mongoose.model("Schedule", ScheduleSchema);
