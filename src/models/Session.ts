import { Schema, Types, model } from 'mongoose';

export const SESSION_STATUSES = ['AVAILABLE', 'BOOKED', 'COMPLETED'] as const;

const sessionSchema = new Schema(
  {
    teacherId: { type: Schema.Types.ObjectId, ref: 'Teacher', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    startTime: { type: Date, required: true },
    endTime: {
      type: Date,
      required: true,
      validate: {
        validator(this: { startTime: Date }, value: Date) {
          return value > this.startTime;
        },
        message: 'endTime must be later than startTime',
      },
    },
    status: { type: String, enum: SESSION_STATUSES, default: 'AVAILABLE', required: true },
    completedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

sessionSchema.index({ status: 1, startTime: 1 });
sessionSchema.index({ userId: 1, status: 1, startTime: 1 });

export const Session = model('Session', sessionSchema);
export type SessionId = Types.ObjectId;
