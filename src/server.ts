import 'dotenv/config';
import mongoose from 'mongoose';
import app from './app';

async function startServer(): Promise<void> {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    throw new Error('MONGODB_URI is required');
  }

  await mongoose.connect(mongoUri);
  const port = Number(process.env.PORT) || 3001;
  app.listen(port, () => {
    console.log(`Session booking API listening on port ${port}`);
  });
}

void startServer().catch((error: unknown) => {
  console.error('Failed to start session booking API:', error);
  process.exitCode = 1;
});
