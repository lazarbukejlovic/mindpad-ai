import mongoose, { Schema, Document } from 'mongoose';

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
  timestamp: Date;
}

export interface ITeamWorkspace extends Document {
  ownerId: string;
  name: string;
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
    timestamp: { type: Date, default: () => new Date() },
  },
  { _id: false }
);

const teamWorkspaceSchema = new Schema<ITeamWorkspace>(
  {
    ownerId: { type: String, required: true, index: true },
    name: { type: String, required: true },
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
