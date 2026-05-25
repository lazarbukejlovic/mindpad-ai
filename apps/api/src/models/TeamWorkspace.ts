import mongoose, { Schema, Document } from 'mongoose';
import type { TeamRole } from './TeamInvite';

export interface ISharedProject {
  id: string;
  name: string;
  description: string;
  createdAt: Date;
}

export interface IActivityEntry {
  id: string;
  action: string;
  actor: string;
  actorName?: string;
  timestamp: Date;
}

export interface ITeamMember {
  userId: string;
  role: TeamRole;
  joinedAt: Date;
}

export interface ITeamWorkspace extends Document {
  ownerId: string;
  name: string;
  members: ITeamMember[];
  // Legacy fields — kept for backward compat with existing workspaces
  invitedEmails: string[];
  memberIds: string[];
  sharedProjects: ISharedProject[];
  activityFeed: IActivityEntry[];
  createdAt: Date;
  updatedAt: Date;
}

const sharedProjectSchema = new Schema<ISharedProject>(
  {
    id: { type: String, required: true },
    name: { type: String, required: true },
    description: { type: String, default: '' },
    createdAt: { type: Date, default: () => new Date() },
  },
  { _id: false }
);

const activityEntrySchema = new Schema<IActivityEntry>(
  {
    id: { type: String, required: true },
    action: { type: String, required: true },
    actor: { type: String, required: true },
    actorName: String,
    timestamp: { type: Date, default: () => new Date() },
  },
  { _id: false }
);

const teamMemberSchema = new Schema<ITeamMember>(
  {
    userId: { type: String, required: true },
    role: { type: String, enum: ['owner', 'admin', 'member'], required: true },
    joinedAt: { type: Date, default: () => new Date() },
  },
  { _id: false }
);

const teamWorkspaceSchema = new Schema<ITeamWorkspace>(
  {
    ownerId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    members: { type: [teamMemberSchema], default: [] },
    invitedEmails: { type: [String], default: [] },
    memberIds: { type: [String], default: [] },
    sharedProjects: { type: [sharedProjectSchema], default: [] },
    activityFeed: { type: [activityEntrySchema], default: [] },
  },
  { timestamps: true }
);

export const TeamWorkspace =
  mongoose.models.TeamWorkspace ||
  mongoose.model<ITeamWorkspace>('TeamWorkspace', teamWorkspaceSchema);
