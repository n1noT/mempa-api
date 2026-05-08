import express, { Express } from "express";
import cookieParser from "cookie-parser";
import session from "express-session";
import helmet from "helmet";
import cors from "cors";

import indexRouter from "./routes/index";
import authRouter from "./routes/auth";
import playlistRouter from "./routes/playlist";

declare module "express-session" {
  interface SessionData {
    user: {
      userId: number;
      username: string | null;
    };
  }
}

const app: Express = express();

if (process.env.NODE_ENV === "production") {
  app.set("trust proxy", 1);
}

app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.use(
  session({
    name: "sessionId",
    secret: process.env.SESSION_SECRET!,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 1000 * 60 * 60 * 24,
    },
  }),
);

app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

app.use("/", indexRouter);
app.use("/auth", authRouter);
app.use("/playlist", playlistRouter);
app.use("/playlists", playlistRouter);

export default app;
