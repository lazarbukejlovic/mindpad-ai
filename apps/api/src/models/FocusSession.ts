import mongoose, { Schema, Document } from 'mongoose';

export interface IFocusSession extends Document {
  userId: string;
  taskId?: string;
  duration: number; // in minutes
  completed: boolean;
  createdAt: Date;
}

const focusSessionSchema = new Schema<IFocusSession>(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    taskId: String,
    duration: {
      type: Number,
      required: true,
      default: 25, // default Pomodoro
    },
    completed: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

export const FocusSession =
  mongoose.models.FocusSession ||
  mongoose.model<IFocusSession>('FocusSession', focusSessionSchema);
