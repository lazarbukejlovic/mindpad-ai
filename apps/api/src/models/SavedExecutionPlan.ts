import mongoose, { Schema, Document } from 'mongoose';

export interface ISavedExecutionPlan extends Document {
  userId: string;
  title: string;
  summary: string;
  steps: string[];
  source: string;
  createdAt: Date;
  updatedAt: Date;
}

const savedExecutionPlanSchema = new Schema<ISavedExecutionPlan>(
  {
    userId: { type: String, required: true, index: true },
    title: { type: String, required: true },
    summary: { type: String, default: '' },
    steps: { type: [String], default: [] },
    source: { type: String, default: 'manual' },
  },
  { timestamps: true }
);

export const SavedExecutionPlan =
  mongoose.models.SavedExecutionPlan ||
  mongoose.model<ISavedExecutionPlan>('SavedExecutionPlan', savedExecutionPlanSchema);
