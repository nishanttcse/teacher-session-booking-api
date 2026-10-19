import { Router } from 'express';
import { Types, type PipelineStage } from 'mongoose';
import { AppError, asyncHandler } from '../errors';
import { Session } from '../models/Session';
import { Teacher } from '../models/Teacher';
import { User } from '../models/User';

const router = Router();

function parseObjectId(value: unknown, label: string): Types.ObjectId {
  if (typeof value !== 'string' || !/^[a-f\d]{24}$/i.test(value)) {
    throw new AppError(400, `${label} must be a valid ObjectId`);
  }
  return new Types.ObjectId(value);
}

function parseDate(value: unknown, label: string): Date {
  if (typeof value !== 'string' || !value.trim()) {
    throw new AppError(400, `${label} must be a valid date string`);
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new AppError(400, `${label} must be a valid date string`);
  }
  return date;
}

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const { teacherId, startTime, endTime } = req.body as Record<string, unknown>;
    if (typeof teacherId !== 'string') {
      throw new AppError(400, 'teacherId is required');
    }

    const teacherObjectId = parseObjectId(teacherId, 'teacherId');
    const start = parseDate(startTime, 'startTime');
    const end = parseDate(endTime, 'endTime');
    if (end <= start) {
      throw new AppError(400, 'endTime must be later than startTime');
    }
    if (!(await Teacher.exists({ _id: teacherObjectId }))) {
      throw new AppError(404, 'Teacher not found');
    }

    const session = await Session.create({
      teacherId: teacherObjectId,
      startTime: start,
      endTime: end,
    });
    res.status(201).json({ data: session });
  }),
);

router.get(
  '/available',
  asyncHandler(async (req, res) => {
    const { dateTimestamp } = req.query;
    if (typeof dateTimestamp !== 'string' || dateTimestamp.trim() === '') {
      throw new AppError(400, 'dateTimestamp (Unix timestamp in milliseconds) is required');
    }
    const timestamp = Number(dateTimestamp);
    if (!Number.isFinite(timestamp)) {
      throw new AppError(400, 'dateTimestamp must be a valid Unix timestamp in milliseconds');
    }

    const date = new Date(timestamp);
    if (Number.isNaN(date.getTime())) {
      throw new AppError(400, 'dateTimestamp is outside the supported date range');
    }
    const startOfDay = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
    const startOfNextDay = new Date(startOfDay);
    startOfNextDay.setUTCDate(startOfNextDay.getUTCDate() + 1);

    const sessions = await Session.aggregate([
      {
        $match: {
          status: 'AVAILABLE',
          startTime: { $gte: startOfDay, $lt: startOfNextDay },
        },
      },
      { $sort: { startTime: 1 } },
      {
        $lookup: {
          from: 'teachers',
          localField: 'teacherId',
          foreignField: '_id',
          as: 'teacherInfo',
        },
      },
      { $unwind: '$teacherInfo' },
      {
        $project: {
          teacherId: 1,
          userId: 1,
          startTime: 1,
          endTime: 1,
          status: 1,
          completedAt: 1,
          createdAt: 1,
          updatedAt: 1,
          teacher: {
            id: '$teacherInfo._id',
            fullName: '$teacherInfo.fullName',
            specialization: '$teacherInfo.specialization',
            experience: '$teacherInfo.experience',
          },
        },
      },
    ] as PipelineStage[]);

    res.status(200).json({ data: sessions });
  }),
);

router.post(
  '/:id/book',
  asyncHandler(async (req, res) => {
    const sessionId = parseObjectId(req.params.id, 'session id');
    const { userId } = req.body as Record<string, unknown>;
    if (typeof userId !== 'string') {
      throw new AppError(400, 'userId is required');
    }
    const userObjectId = parseObjectId(userId, 'userId');
    if (!(await User.exists({ _id: userObjectId }))) {
      throw new AppError(404, 'User not found');
    }

    const session = await Session.findOneAndUpdate(
      { _id: sessionId, status: 'AVAILABLE' },
      { $set: { status: 'BOOKED', userId: userObjectId } },
      { new: true, runValidators: true },
    );
    if (!session) {
      if (!(await Session.exists({ _id: sessionId }))) {
        throw new AppError(404, 'Session not found');
      }
      throw new AppError(409, 'Session is no longer available');
    }

    res.status(200).json({ data: session });
  }),
);

router.patch(
  '/:id/complete',
  asyncHandler(async (req, res) => {
    const sessionId = parseObjectId(req.params.id, 'session id');
    const session = await Session.findOneAndUpdate(
      { _id: sessionId, status: 'BOOKED' },
      { $set: { status: 'COMPLETED', completedAt: new Date() } },
      { new: true, runValidators: true },
    );
    if (!session) {
      if (!(await Session.exists({ _id: sessionId }))) {
        throw new AppError(404, 'Session not found');
      }
      throw new AppError(409, 'Only booked sessions can be completed');
    }

    res.status(200).json({ data: session });
  }),
);

export default router;
