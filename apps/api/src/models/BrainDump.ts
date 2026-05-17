import mongoose, { Schema, Document } from 'mongoose';

export interface IBrainDump extends Document {
  userId: string;
  content: string;
  summary?: string;
  suggestedTasks?: string[];
  organized: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const brainDumpSchema = new Schema<IBrainDump>(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    content: {
      type: String,
      required: true,
    },
    summary: String,
    suggestedTasks: [String],
    organized: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

export const BrainDump =
  mongoose.models.BrainDump ||
  mongoose.model<IBrainDump>('BrainDump', brainDumpSchema);
