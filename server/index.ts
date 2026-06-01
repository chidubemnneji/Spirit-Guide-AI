import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import pg from "pg";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { createServer } from "http";
import { isEnabled } from "./flags";
import { initSentry, Sentry, isSentryEnabled } from "./sentry";

initSentry();
const app = express();
app.set('trust proxy', 1);
const httpServer = createServer(app);
const PgSession = connectPgSimple(session);
const sessionPool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}
app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);
app.use(express.urlencoded({ extended: false }));
// Session middleware
const SESSION_SECRET = process.env.SESSION_SECRET;
if (!SESSION_SECRET && process.env.NODE_ENV === "production") {
  throw new Error("SESSION_SECRET environment variable must be set in production.");
}
app.use(
  session({
    secret: SESSION_SECRET || "soulguide-dev-secret-do-not-use-in-prod",
    resave: false,
    saveUninitialized: false,
    store: new PgSession({
      pool: sessionPool,
      tableName: "user_sessions",
      createTableIfMissing: false,
    }),
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    },
  })
);
export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      // Log metadata only — never response bodies (they contain private
      // conversation, persona, journal, and crisis content).
      log(`${req.method} ${path} ${res.statusCode} in ${duration}ms`);
    }
  });
  next();
});
(async () => {
  // Schema is managed by Drizzle migrations, run as a release step
  // (see package.json "migrate" + railway.json), not at app startup.

  if (!process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY) {
    console.warn("⚠️  WARNING: AI_INTEGRATIONS_ANTHROPIC_API_KEY is not configured.");
    console.warn("   AI chat features will use templated fallback responses.");
    console.warn("   To enable full AI functionality, please configure the Anthropic integration.");
  } else {
    log("AI integration configured with Anthropic API", "config");
  }
  
  if (!process.env.SESSION_SECRET || process.env.SESSION_SECRET === "soulguide-dev-secret") {
    console.warn("⚠️  WARNING: Using default SESSION_SECRET. Set a secure secret for production.");
  }
  const { setupGoogleAuth } = await import("./services/googleAuth");
  if (isEnabled("GOOGLE_AUTH")) {
    setupGoogleAuth(app);
    log("Google auth enabled", "auth");
  }
  // Health check (Railway/uptime probes)
  app.get("/health", (_req, res) => res.status(200).json({ status: "ok" }));
  await registerRoutes(httpServer, app);
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    console.error("[error]", status, message, err.stack || "");
    if (isSentryEnabled() && status >= 500) {
      Sentry.captureException(err);
    }
    if (!res.headersSent) {
      res.status(status).json({ message });
    }
  });
  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  } else {
    const { setupVite } = await import("./vite");
    await setupVite(httpServer, app);
  }
  const port = parseInt(process.env.PORT || "5000", 10);
  httpServer.listen(
    {
      port,
      host: "0.0.0.0",
      reusePort: true,
    },
    () => {
      log(`serving on port ${port}`);
    },
  );
})();
