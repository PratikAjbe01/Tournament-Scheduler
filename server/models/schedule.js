// models/Schedule.js
const mongoose = require("mongoose");

const ScheduleSchema = new mongoose.Schema({
  matchNumber: {
    type: Number,
    required: true
  },
  teamA: {
    type: String,
    required: true
  },
  teamB: {
    type: String,
    required: true
  },
  matchDate: {
    type: Date,
    required: true
  },
  venue: {
    type: String,
    required: true
  },
  tournament: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Tournament"
  }
}, { timestamps: true });

module.exports = mongoose.model("Schedule", ScheduleSchema);
