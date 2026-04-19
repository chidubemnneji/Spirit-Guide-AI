import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import type { Express } from "express";
import { storage } from "../storage";
import type { SessionWithUser } from "../routes";

export function setupGoogleAuth(app: Express) {
  const clientID = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const appUrl = process.env.APP_URL || "https://spirit-guide-ai-production.up.railway.app";

  if (!clientID || !clientSecret) {
    console.warn("[auth] GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET not set — Google login disabled");
    return;
  }

  passport.use(
    new GoogleStrategy(
      {
        clientID,
        clientSecret,
        callbackURL: `${appUrl}/api/auth/google/callback`,
      },
      async (_accessToken, _refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value;
          const name = profile.displayName || profile.name?.givenName || "Friend";
          const googleId = profile.id;

          if (!email) return done(new Error("No email from Google"));

          // Check if user exists by email
          let user = await storage.getUserByEmail(email);

          if (user) {
            // Existing user — update googleId if not set
            if (!(user as any).googleId) {
              await storage.updateUser(user.id, { googleId } as any);
            }
            return done(null, user);
          }

          // New user — create account (no password needed)
          user = await storage.createUser({
            email,
            name,
            password: `google_${googleId}`, // placeholder, never used
            googleId,
          } as any);

          return done(null, user);
        } catch (err) {
          return done(err as Error);
        }
      }
    )
  );

  passport.serializeUser((user: any, done) => done(null, user.id));
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (err) {
      done(err);
    }
  });

  app.use(passport.initialize());
  app.use(passport.session());

  // Redirect to Google
  app.get(
    "/api/auth/google",
    passport.authenticate("google", { scope: ["profile", "email"] })
  );

  // Google callback
  app.get(
    "/api/auth/google/callback",
    passport.authenticate("google", { failureRedirect: "/?error=google_failed" }),
    async (req, res) => {
      const user = req.user as any;
      if (!user) return res.redirect("/?error=google_failed");

      // Set session
      const session = req.session as SessionWithUser;
      session.userId = user.id;

      // Redirect based on onboarding status
      if (user.hasCompletedOnboarding) {
        res.redirect("/home");
      } else {
        res.redirect("/onboarding");
      }
    }
  );
}
