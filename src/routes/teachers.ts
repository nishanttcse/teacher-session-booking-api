import { Router } from 'express';
import { asyncHandler } from '../errors';
import { Teacher } from '../models/Teacher';

const router = Router();

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const { fullName, email, specialization, experience } = req.body as Record<string, unknown>;
    if (
      typeof fullName !== 'string' || !fullName.trim() ||
      typeof email !== 'string' || !email.trim() ||
      typeof specialization !== 'string' || !specialization.trim() ||
      typeof experience !== 'number' || !Number.isFinite(experience) || experience < 0
    ) {
      res.status(400).json({
        error: 'fullName, email, specialization, and a non-negative numeric experience are required',
      });
      return;
    }

    const teacher = await Teacher.create({ fullName, email, specialization, experience });
    res.status(201).json({ data: teacher });
  }),
);

export default router;
