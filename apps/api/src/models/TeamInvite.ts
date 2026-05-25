import mongoose, { Schema, Document } from 'mongoose';

export type TeamRole = 'owner' | 'admin' | 'member';

export interface ITeamInvite extends Document {
  teamId: string;
  invitedEmail: string;
  invitedByUserId: string;
  role: TeamRole;
  tokenHash: string;
  expiresAt: Date;
  acceptedAt?: Date;
  revokedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const teamInviteSchema = new Schema<ITeamInvite>(
  {
    teamId: { type: String, required: true, index: true },
    invitedEmail: { type: String, required: true, lowercase: true, trim: true },
    invitedByUserId: { type: String, required: true },
    role: { type: String, enum: ['owner', 'admin', 'member'], default: 'member' },
    tokenHash: { type: String, required: true, unique: true, index: true },
    expiresAt: { type: Date, required: true },
    acceptedAt: Date,
    revokedAt: Date,
  },
  { timestamps: true }
);

export const TeamInvite =
  mongoose.models.TeamInvite ||
  mongoose.model<ITeamInvite>('TeamInvite', teamInviteSchema);
