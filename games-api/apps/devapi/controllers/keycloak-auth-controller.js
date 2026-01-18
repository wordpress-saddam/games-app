const passport = require('passport');
const OAuth2Strategy = require('passport-oauth2').Strategy;
const Config = require('../../../config/config');
const GamesUser = require('../../../core_libs/models/mongodb/db-games-users');
const { generateToken } = require('../../../core_libs/utils/jwt-helper');
const https = require('https');
const http = require('http');

/**
 * Configure Keycloak OAuth Strategy
 * Using OAuth2Strategy as Keycloak supports OAuth 2.0 / OpenID Connect
 * Note: passport-oauth2 doesn't automatically fetch user profile, so we do it manually
 */
passport.use('keycloak', new OAuth2Strategy({
    authorizationURL: Config.keycloak.authorizationURL,
    tokenURL: Config.keycloak.tokenURL,
    clientID: Config.keycloak.clientID,
    clientSecret: Config.keycloak.clientSecret,
    callbackURL: Config.keycloak.callbackURL,
    scope: ['openid', 'profile', 'email']
}, async (accessToken, refreshToken, params, done) => {
    try {
        // Fetch user info from Keycloak using native http/https
        const userInfo = await new Promise((resolve, reject) => {
            const url = new URL(Config.keycloak.userInfoURL);
            const protocol = url.protocol === 'https:' ? https : http;
            
            const options = {
                hostname: url.hostname,
                port: url.port || (url.protocol === 'https:' ? 443 : 80),
                path: url.pathname + url.search,
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                }
            };

            const req = protocol.request(options, (res) => {
                let data = '';
                res.on('data', (chunk) => { data += chunk; });
                res.on('end', () => {
                    try {
                        if (res.statusCode !== 200) {
                            reject(new Error(`Keycloak userinfo request failed: ${res.statusCode}`));
                            return;
                        }
                        resolve(JSON.parse(data));
                    } catch (e) {
                        reject(new Error('Failed to parse user info response'));
                    }
                });
            });

            req.on('error', reject);
            req.end();
        });

        const keycloakUser = userInfo;
        
        // Extract user data from Keycloak response
        const email = keycloakUser.email;
        const name = keycloakUser.name || keycloakUser.preferred_username || (email ? email.split('@')[0] : 'User');
        const keycloakId = keycloakUser.sub; // Keycloak user ID
        const picture = keycloakUser.picture || null;

        if (!keycloakId || !email) {
            throw new Error('Missing required Keycloak profile fields');
        }

        // Create profile object similar to Google format for compatibility
        const keycloakProfile = {
            id: keycloakId,
            emails: [{ value: email }],
            displayName: name,
            photos: picture ? [{ value: picture }] : []
        };

        // Find or create user using Keycloak method (stores keycloakId in keycloakId field)
        const user = await GamesUser.findOrCreateKeycloak(keycloakProfile);
        return done(null, user);
    } catch (err) {
        console.error('Error in Keycloak OAuth strategy:', err);
        return done(err, null);
    }
}));

/**
 * Initiate Keycloak OAuth login
 */
const initiateKeycloakAuth = passport.authenticate('keycloak', {
    scope: ['openid', 'profile', 'email']
});

/**
 * Handle Keycloak OAuth callback
 */
const handleKeycloakCallback = (req, res, next) => {
    passport.authenticate('keycloak', { session: false }, async (err, user) => {
        try {
            if (err) {
                console.error('Keycloak OAuth error:', err);
                const frontendUrl = Config.frontendUrl || 'http://localhost:8080';
                return res.redirect(`${frontendUrl}/login/error?message=${encodeURIComponent('Authentication failed')}`);
            }

            if (!user) {
                const frontendUrl = Config.frontendUrl || 'http://localhost:8080';
                return res.redirect(`${frontendUrl}/login/error?message=${encodeURIComponent('User not found')}`);
            }

            // Generate JWT token with provider field
            const token = generateToken(user, 'keycloak');

            // Store auth token in database
            await GamesUser.updateUserAuthToken(user._id, token);

            // Redirect to frontend with token
            const frontendUrl = Config.frontendUrl || 'http://localhost:8080';
            res.redirect(`${frontendUrl}/login/success?token=${token}`);
        } catch (error) {
            console.error('Error in Keycloak callback handler:', error);
            const frontendUrl = Config.frontendUrl || 'http://localhost:8080';
            res.redirect(`${frontendUrl}/login/error?message=${encodeURIComponent('Token generation failed')}`);
        }
    })(req, res, next);
};

/**
 * Handle logout - redirects to Keycloak logout and then frontend
 */
const handleLogout = (req, res) => {
    try {
        const frontendUrl = Config.frontendUrl || 'http://localhost:8080';
        const logoutRedirectUri = encodeURIComponent(frontendUrl);
        const keycloakLogoutUrl = `${Config.keycloak.logoutURL}?client_id=asharq-gameshub&post_logout_redirect_uri=${logoutRedirectUri}`;
        
        // Redirect to Keycloak logout
        res.redirect(keycloakLogoutUrl);
    } catch (error) {
        console.error('Error in logout handler:', error);
        const frontendUrl = Config.frontendUrl || 'http://localhost:8080';
        res.redirect(frontendUrl);
    }
};

module.exports = {
    initiateKeycloakAuth,
    handleKeycloakCallback,
    handleLogout
};

