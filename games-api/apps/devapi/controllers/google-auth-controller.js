const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const Config = require('../../../config/config');
const GamesUser = require('../../../core_libs/models/mongodb/db-games-users');
const { generateToken } = require('../../../core_libs/utils/jwt-helper');

// Configure Google OAuth Strategy
passport.use(new GoogleStrategy({
    clientID: Config.google.clientID,
    clientSecret: Config.google.clientSecret,
    callbackURL: `${process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5002'}/v1/auth/google/callback`
}, async (accessToken, refreshToken, profile, done) => {
    try {
        // Extract profile data
        let displayName = profile.displayName;
        if (!displayName && profile.name) {
            const givenName = profile.name.givenName || '';
            const familyName = profile.name.familyName || '';
            displayName = `${givenName} ${familyName}`.trim() || 'User';
        }
        displayName = displayName || 'User';
        
        const googleProfile = {
            id: profile.id,
            emails: profile.emails || [],
            displayName: displayName,
            photos: profile.photos || []
        };
        
        // Find or create user
        const user = await GamesUser.findOrCreate(googleProfile);
        return done(null, user);
    } catch (err) {
        console.error('Error in Google OAuth strategy:', err);
        return done(err, null);
    }
}));

// Serialize user for session (we won't use sessions, but passport requires this)
passport.serializeUser((user, done) => {
    done(null, user._id);
});

passport.deserializeUser(async (id, done) => {
    try {
        const user = await GamesUser.findActiveById(id);
        done(null, user);
    } catch (err) {
        done(err, null);
    }
});

/**
 * Initiate Google OAuth login
 */
const initiateGoogleAuth = passport.authenticate('google', {
    scope: ['profile', 'email']
});

/**
 * Handle Google OAuth callback
 */
const handleGoogleCallback = (req, res, next) => {
    passport.authenticate('google', { session: false }, async (err, user) => {
        try {
            if (err) {
                console.error('Google OAuth error:', err);
                // const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:8080';
                const frontendUrl = Config.googleReturnUrl;
                return res.redirect(`${frontendUrl}/login/error?message=${encodeURIComponent('Authentication failed')}`);
            }

            if (!user) {
                // const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:8080';
                const frontendUrl = Config.googleReturnUrl;
                return res.redirect(`${frontendUrl}/login/error?message=${encodeURIComponent('User not found')}`);
            }

            // Generate JWT token with provider
            const token = generateToken(user, 'google');

            // Store auth token in database
            await GamesUser.updateUserAuthToken(user._id, token);

            // Redirect to frontend with token
            // const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:8080';
            const frontendUrl = Config.googleReturnUrl;
            res.redirect(`${frontendUrl}/login/success?token=${token}`);
        } catch (error) {
            console.error('Error in Google callback handler:', error);
            // const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:8080';
            const frontendUrl = Config.googleReturnUrl;
            res.redirect(`${frontendUrl}/login/error?message=${encodeURIComponent('Token generation failed')}`);
        }
    })(req, res, next);
};

module.exports = {
    initiateGoogleAuth,
    handleGoogleCallback
};

