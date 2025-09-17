// models/Tournament.js
const mongoose = require("mongoose");

const TournamentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Tournament name is required"]
  },
  department: {
    type: String
  },
  organizer: {
    type: String,
    required: [true, "Organizer is required"]
  },
  frequencyOfMatches: {
    type: Number,// e.g., "Weekly", "Daily", or Number of matches
    required: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  matchStartTime: {
    type: String, // HH:MM format
    required: true
  },
  venue: {
    type: String,
    required: true
  },
  schedules: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Schedule"
    }
  ]
}, { timestamps: true });

module.exports = mongoose.model("Tournament", TournamentSchema);
