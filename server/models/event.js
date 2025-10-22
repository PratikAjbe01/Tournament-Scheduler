import mongoose from "mongoose";

// ============================================
// 1. EVENT MODEL (e.g., DAVV2025)
// ============================================
const eventSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Event name is required'],
      trim: true,
      unique: true,
      example:  'Sports Fest 2024'
    },
    description: {
      type: String,
      trim: true
    },
    year: {
      type: Number,
      required: [true, 'Year is required'],
      min: 2000,
      max: 2100
    },
    status: {
      type: String,
      enum: ['upcoming', 'ongoing', 'completed'],
      default: 'upcoming'
    },
    startDate: {
      type: Date,
      required: [true, 'Start date is required']
    },
    endDate: {
      type: Date,
      required: [true, 'End date is required'],
      validate: {
        validator: function(value) {
          return value > this.startDate;
        },
        message: 'End date must be after start date'
      }
    },
    location: {
      type: String,
      trim: true
    },
   userId:{type:mongoose.Schema.Types.ObjectId,ref:"Admin",required:true},
    image: {
      type: String,
      default: null
    }
  },
  { timestamps: true }
);

// ============================================
// MODEL EXPORTS
// ============================================
const Event = mongoose.model('Event', eventSchema);
export default Event;