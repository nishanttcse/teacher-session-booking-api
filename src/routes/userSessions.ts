import { Router } from 'express';
import { Types, type PipelineStage } from 'mongoose';
import { AppError, asyncHandler } from '../errors';
import { User } from '../models/User';
import { Session } from '../models/Session';

const router = Router();

router.get(
  '/:id/sessions',
  asyncHandler(async (req, res) => {
    const id = req.params.id;
    if (typeof id !== 'string' || !/^[a-f\d]{24}$/i.test(id)) {
      throw new AppError(400, 'user id must be a valid ObjectId');
    }
    const objectId = new Types.ObjectId(id);
    if (!(await User.exists({ _id: objectId }))) {
      throw new AppError(404, 'User not found');
    }

    const [grouped = { upcoming: [], completed: [] }] = await Session.aggregate([
      { $match: { userId: objectId } },
      {
        $facet: {
          upcoming: [
            { $match: { status: 'BOOKED', startTime: { $gte: new Date() } } },
            { $sort: { startTime: 1 } },
          ],
          completed: [
            { $match: { status: 'COMPLETED' } },
            { $sort: { completedAt: -1 } },
          ],
        },
      },
    ] as PipelineStage[]);

    res.status(200).json({ data: grouped });
  }),
);

export default router;
