import mongoose, { Schema, Document } from 'mongoose';
import bcryptjs from 'bcryptjs';

export interface IUser extends Document {
  email: string;
  passwordHash?: string;
  authProvider?: 'email' | 'google' | 'mixed';
  googleId?: string;
  avatarUrl?: string;
  name?: string;
  plan: 'free' | 'pro' | 'team';
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  subscriptionStatus?: string;
  currentPeriodEnd?: Date;
  cancelAtPeriodEnd?: boolean;
  dailyExtractionsUsed?: number;
  dailyExtractionsUsedDate?: Date;
  emailVerified?: boolean;
  emailVerificationToken?: string;
  emailVerificationExpires?: Date;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  onboardingCompleted?: boolean;
  onboardingGoal?: string;
  onboardingStep?: string;
  firstBrainDumpCompleted?: boolean;
  firstTasksExtracted?: boolean;
  firstFocusStarted?: boolean;
  onboardingCompletedAt?: Date;
  createdAt: Date;
  comparePassword(password: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: false,
    },
    authProvider: {
      type: String,
      enum: ['email', 'google', 'mixed'],
      default: 'email',
    },
    googleId: String,
    avatarUrl: String,
    name: String,
    plan: {
      type: String,
      enum: ['free', 'pro', 'team'],
      default: 'free',
    },
    stripeCustomerId: String,
    stripeSubscriptionId: String,
    subscriptionStatus: String,
    currentPeriodEnd: Date,
    cancelAtPeriodEnd: {
      type: Boolean,
      default: false,
    },
    dailyExtractionsUsed: {
      type: Number,
      default: 0,
    },
    dailyExtractionsUsedDate: Date,
    emailVerified: {
      type: Boolean,
      default: false,
    },
    emailVerificationToken: String,
    emailVerificationExpires: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
    onboardingCompleted: { type: Boolean, default: false },
    onboardingGoal: String,
    onboardingStep: String,
    firstBrainDumpCompleted: { type: Boolean, default: false },
    firstTasksExtracted: { type: Boolean, default: false },
    firstFocusStarted: { type: Boolean, default: false },
    onboardingCompletedAt: Date,
  },
  {
    timestamps: true,
  }
);

userSchema.methods.comparePassword = async function (password: string) {
  if (!this.passwordHash) return false;
  return bcryptjs.compare(password, this.passwordHash);
};

export const User =
  mongoose.models.User || mongoose.model<IUser>('User', userSchema);
