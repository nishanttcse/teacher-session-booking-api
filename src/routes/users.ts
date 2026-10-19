import { Router } from 'express';
import { asyncHandler } from '../errors';
import { User } from '../models/User';

const router = Router();

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const { fullName, email, phone } = req.body as Record<string, unknown>;
    if (
      typeof fullName !== 'string' || !fullName.trim() ||
      typeof email !== 'string' || !email.trim() ||
      typeof phone !== 'string' || !phone.trim()
    ) {
      res.status(400).json({ error: 'fullName, email, and phone are required' });
      return;
    }

    const user = await User.create({ fullName, email, phone });
    res.status(201).json({ data: user });
  }),
);

export default router;
