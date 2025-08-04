import mongoose from "mongoose";

const autoReviewSchema: any = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    trim: true,
  },
  repoId: {
    type: String,
    required: true,
    trim: true,
  },
  autoReview: {
    type: Boolean,
    default: false,
  },
},{ timestamps: true });

const AutoReview = mongoose.models.AutoReview || mongoose.model("AutoReview", autoReviewSchema);

export default AutoReview;
