import express from 'express';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import sessionsRouter from './routes/sessions';
import teachersRouter from './routes/teachers';
import userSessionsRouter from './routes/userSessions';
import usersRouter from './routes/users';

const app = express();

app.use(express.json({ limit: '1mb' }));
app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'OK' });
});
app.use('/users', usersRouter);
app.use('/users', userSessionsRouter);
app.use('/teachers', teachersRouter);
app.use('/sessions', sessionsRouter);
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
