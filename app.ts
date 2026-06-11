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

/**
 * Extension du type SessionData d'express-session pour typer les données utilisateur
 * stockées en session dans l'ensemble de l'application.
 * Cela évite d'utiliser `any` lors de l'accès à req.session.user dans les routes.
 */
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

// En production derrière un reverse proxy (ex: nginx), on fait confiance au premier proxy
// pour que les cookies secure et l'IP client soient correctement transmis
// (Config par défaut)
if (process.env.NODE_ENV === "production") {
  app.set("trust proxy", 1);
}

// Middlewares de sécurité et de parsing
app.use(helmet()); // Ajoute des en-têtes HTTP de sécurité (CSP, X-Frame-Options, etc.)
app.use(express.json()); // Parsing JSON
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser()); // Parsing des cookies
// Exposition du dossier public/uploads pour servir les fichiers audio uploadés
app.use("/uploads", express.static("public/uploads"));

/**
 * Configuration de la session serveur.
 * - httpOnly empêche l'accès au cookie depuis JavaScript côté client (protection XSS)
 * - secure n'envoie le cookie que sur HTTPS en production
 * - sameSite "lax" protège contre les attaques CSRF tout en autorisant la navigation entrante
 * - maxAge fixé à 24h pour limiter la durée de vie d'une session inactive
 */
app.use(
  session({
    name: "sessionId",
    secret: process.env.SESSION_SECRET!,
    resave: false,
    saveUninitialized: false, // On ne crée pas de session pour les requêtes anonymes
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 1000 * 60 * 60 * 24,
    },
  }),
);

/**
 * Configuration CORS pour autoriser uniquement les requêtes provenant du frontend.
 * credentials: true est obligatoire pour que le navigateur transmette les cookies de session
 * dans les requêtes cross-origin.
 */
app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

// Montage des routeurs
app.use("/", indexRouter);
app.use("/auth", authRouter);
app.use("/tracks", tracksRouter);
app.use("/styles", stylesRouter);
// Les deux préfixes /playlist et /playlists pointent vers le même routeur pour compatibilité
app.use("/playlist", playlistRouter);
app.use("/playlists", playlistRouter);
app.use("/users", userRouter);
app.use("/suggestions", suggestionRouter);
app.use("/profile", profileRouter);

export default app;
