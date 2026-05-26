import mongoose, { Schema, Document } from 'mongoose';

export interface ICalendarConnection extends Document {
  userId: mongoose.Types.ObjectId;
  provider: 'google';
  googleEmail?: string;
  calendarId: string;
  accessTokenEncrypted: string;
  refreshTokenEncrypted?: string;
  tokenExpiryDate?: Date;
  scopes: string[];
  connectedAt: Date;
  disconnectedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const calendarConnectionSchema = new Schema<ICalendarConnection>(
  {
    userId:                 { type: Schema.Types.ObjectId, required: true, ref: 'User', index: true },
    provider:               { type: String, enum: ['google'], default: 'google' },
    googleEmail:            { type: String },
    calendarId:             { type: String, default: 'primary' },
    accessTokenEncrypted:   { type: String, required: true },
    refreshTokenEncrypted:  { type: String },
    tokenExpiryDate:        { type: Date },
    scopes:                 { type: [String], default: [] },
    connectedAt:            { type: Date, default: Date.now },
    disconnectedAt:         { type: Date },
  },
  { timestamps: true }
);

export const CalendarConnection =
  mongoose.models.CalendarConnection ||
  mongoose.model<ICalendarConnection>('CalendarConnection', calendarConnectionSchema);
