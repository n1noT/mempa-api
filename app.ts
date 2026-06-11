import express, { Express } from "express";
import cookieParser from "cookie-parser";
import session from "express-session";
import helmet from "helmet";
import cors from "cors";

import indexRouter from "./routes/index";
import authRouter from "./routes/auth";
import playlistRouter from "./routes/playlist";
import tracksRouter from "./routes/tracks";
import stylesRouter from "./routes/styles";
import userRouter from "./routes/user";
import suggestionRouter from "./routes/suggestions";
import profileRouter from "./routes/profile";

declare module "express-session" {
  interface SessionData {
    user: {
      id: number;
      username: string | null;
      email: string | null;
      role: "ADMIN" | "USER";
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
app.use("/uploads", express.static("public/uploads"));

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
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

app.use("/", indexRouter);
app.use("/auth", authRouter);
app.use("/tracks", tracksRouter);
app.use("/styles", stylesRouter);
app.use("/playlist", playlistRouter);
app.use("/playlists", playlistRouter);
app.use("/users", userRouter);
app.use("/suggestions", suggestionRouter);
app.use("/profile", profileRouter);

export default app;
