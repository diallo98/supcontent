require('dotenv').config()
const passport = require('passport')
const { Strategy: GoogleStrategy } = require('passport-google-oauth20')
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: '/api/auth/google/callback'
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      // Cherche si l'utilisateur existe déjà
      let user = await prisma.user.findUnique({
        where: { email: profile.emails[0].value }
      })

      // Sinon on le crée automatiquement
      if (!user) {
        user = await prisma.user.create({
          data: {
            email: profile.emails[0].value,
            username: profile.displayName,
            avatarUrl: profile.photos[0].value
          }
        })
      }

      return done(null, user)
    } catch (error) {
      return done(error, null)
    }
  }
))

module.exports = passport