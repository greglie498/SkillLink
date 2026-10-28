import 'dotenv/config';
import express, { type Request, type Response, type NextFunction } from 'express';
import cors from 'cors';
import { Prisma } from '@prisma/client';
import skillsRouter from './routes/skills';
import opportunitiesRouter from './routes/opportunities';
import authRouter from './routes/auth';
import talentRouter from './routes/talent';
import { authLimiter } from './middleware/rateLimit';
import helmet from 'helmet';

const app = express();

// Behind Render's proxy the real client IP address
if (process.env.NODE_ENV === 'production') app.set('trust proxy', 1);

app.use(helmet ());
app.use(cors({ origin: process.env.FRONTEND_ORIGIN ?? 'http://localhost:5173' }));
app.use(express.json({limit: "100kb"}));

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));
app.use('/api/auth',  authLimiter, authRouter);
app.use('/api/skills', skillsRouter);
app.use('/api/opportunities', opportunitiesRouter);
app.use ('/api/talent', talentRouter)

// Central error handler (must have 4 params)
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code == 'P2002') {
        return res.status(409).json({ message: 'That record already exists. '});
    }
    // Client errors from middleware (malformed JSON,  body  too large)
    const status = (err as  { status?: number})  ?.status;
    if (typeof status === 'number' && status >= 400 && status < 500) {
        return res.status(status).json({ message: 'Invalid Request'});
    }

    console.error(err);
    res.status(500).json({ message: 'Something went wrong on the server. '});
});

const port = Number(process.env.PORT ?? 4000);
app.listen(port, () => console.log(`API running on http://localhost:${port}`));