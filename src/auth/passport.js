import passport from "passport";
import pkg from "passport-jwt";
import db from "../config/dbHelper.js";
import dotenv from 'dotenv';
dotenv.config();

const { Strategy: JwtStrategy, ExtractJwt } = pkg;

const opts = {
  jwtFromRequest: ExtractJwt.fromExtractors([
    ExtractJwt.fromAuthHeaderAsBearerToken(),
  ]),
  secretOrKey: process.env.JSON_WEB_TOKEN,
};

passport.use(
  new JwtStrategy(opts, async (payload, done) => {
    try {
      const result = await db.query(
        'SELECT id, email FROM "User" WHERE id = $1',
        [payload.sub]
      );

      const user = result.rows[0];
      
      if (!user) return done(null, false);

      return done(null, { id: user.id, email: user.email });
    } catch (error) {
      return done(error, false);
    }
  })
);

export const authenticate = (req, res, next) => {
  passport.authenticate("jwt", { session: false }, (err, user, info) => {

    if (err) {
      console.error("Auth error:", err);
      return res.status(500).json({
        status: 500,
        message: "Terjadi kesalahan pada server",
        data: null,
      });
    }

    if (!user) {
      let message = "Token tidak valid atau kadaluwarsa";

      if (info?.name === "TokenExpiredError") {
        message = "Token sudah kadaluwarsa";
      } else if (info?.name === "JsonWebTokenError") {
        message = "Token tidak valid";
      }

      return res.status(401).json({
        status: 108,
        message,
        data: null,
      });
    }

    req.user = user;
    next();
  })(req, res, next);
};