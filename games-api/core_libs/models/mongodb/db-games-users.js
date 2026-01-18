const mongoose = require('../../utils/database-connection').Mongoose;
const { ObjectId } = mongoose.Schema.Types;

const gamesUserSchema = new mongoose.Schema({
    keycloakId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    googleId: {
        type: String,
        required: false,
        default: null
    },
    email: {
        type: String,
        required: true,
        lowercase: true,
        trim: true,
        index: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    picture: {
        type: String,
        default: null
    },
    status: {
        type: Boolean,
        default: true
    },
    auth_token: {
        type: String,
        default: null
    },
    continuous_games: {
        type: Array,
        default: []
    },
    theme: {
        type: String,
        default: 'light'
    },
    high_scores: {
        type: Array,
        default: []
    }
}, {
    timestamps: true
});

// Validation: At least one of googleId or keycloakId must be present
gamesUserSchema.pre('save', function(next) {
    if (!this.keycloakId) {
        return next(new Error('keycloakId must be provided'));
    }
    next();
});

// Static method to find or create user (Google OAuth)
gamesUserSchema.statics.findOrCreate = async function(googleProfile, authToken = null) {
    try {
        const { id: googleId, emails, displayName: name, photos } = googleProfile;
        const email = emails && emails[0] ? emails[0].value : null;
        const picture = photos && photos[0] ? photos[0].value : null;

        if (!googleId || !email || !name) {
            throw new Error('Missing required Google profile fields');
        }

        // Try to find existing user by googleId
        let user = await this.findOne({ googleId });

        if (!user) {
            // Try to find by email as fallback
            user = await this.findOne({ email });
            
            if (user) {
                // Update existing user with googleId
                user.googleId = googleId;
                user.name = name;
                if (picture) user.picture = picture;
                if (authToken) user.auth_token = authToken;
                await user.save();
            } else {
                // Create new user
                user = new this({
                    googleId,
                    email,
                    name,
                    picture,
                    auth_token: authToken || null
                });
                await user.save();
            }
        } else {
            // Update user info if changed
            if (user.name !== name) user.name = name;
            if (picture && user.picture !== picture) user.picture = picture;
            if (authToken) user.auth_token = authToken;
            await user.save();
        }

        return user;
    } catch (err) {
        console.error('Error in findOrCreate:', err);
        throw err;
    }
};

// Static method to find or create user (Keycloak OAuth)
// Stores Keycloak 'sub' (user ID) in keycloakId field, leaves googleId empty
gamesUserSchema.statics.findOrCreateKeycloak = async function(keycloakProfile, authToken = null) {
    try {
        const { id: keycloakId, emails, displayName: name, photos } = keycloakProfile;
        const email = emails && emails[0] ? emails[0].value : null;
        const picture = photos && photos[0] ? photos[0].value : null;

        if (!keycloakId || !email || !name) {
            throw new Error('Missing required Keycloak profile fields');
        }

        // Try to find existing user by keycloakId
        let user = await this.findOne({ keycloakId });

        if (!user) {
            // Try to find by email as fallback (email is unique identifier)
            user = await this.findOne({ email });
            
            if (user) {
                // Update existing user with keycloakId, clear googleId if it was set
                user.keycloakId = keycloakId;
                user.name = name;
                if (picture) user.picture = picture;
                if (authToken) user.auth_token = authToken;
                await user.save();
            } else {
                // Create new user with keycloakId, leave googleId empty
                user = new this({
                    keycloakId,
                    email,
                    name,
                    picture,
                    auth_token: authToken || null
                });
                await user.save();
            }
            
        } else {
            // Update user info if changed
            if (user.name !== name) user.name = name;
            if (picture && user.picture !== picture) user.picture = picture;
            if (authToken) user.auth_token = authToken;
            await user.save();
        }

        return user;
    } catch (err) {
        console.error('Error in findOrCreateKeycloak:', err);
        throw err;
    }
};

// Static method to find active user by ID (using different name to avoid shadowing mongoose findById)
gamesUserSchema.statics.findActiveById = async function(userId) {
    try {
        return await this.findOne({ _id: userId, status: true });
    } catch (err) {
        console.error('Error finding user by ID:', err);
        return null;
    }
};

gamesUserSchema.statics.updateUserAuthToken = async function(userId, authToken) {
    try {
        const result = await this.updateOne({ _id: userId }, { $set: { auth_token: authToken } });
        return result;
    } catch (err) {
        console.error('Error updating user auth token:', err);
        throw err;
    }
};

// Static method to find user by auth token
gamesUserSchema.statics.findByAuthToken = async function(authToken) {
    try {
        return await this.findOne({ auth_token: authToken, status: true });
    } catch (err) {
        console.error('Error finding user by auth token:', err);
        return null;
    }
};

// Static method to get user auth token
gamesUserSchema.statics.getUserAuthToken = async function(userId) {
    try {
        const user = await this.findOne({ _id: userId, status: true }, { auth_token: 1 });
        return user ? user.auth_token : null;
    } catch (err) {
        console.error('Error getting user auth token:', err);
        return null;
    }
};

gamesUserSchema.statics.updateUserContinuousGames = async function(userId, continuousGames) {
    try {
        return await this.updateOne({ _id: userId }, { $set: { continuous_games: continuousGames } });
    } catch (err) {
        console.error('Error updating user continuous games:', err);
        return null;
    }
};

gamesUserSchema.statics.updateUserTheme = async function(userId, theme) {
    try {
        return await this.updateOne({ _id: userId }, { $set: { theme: theme } });
    } catch (err) {
        console.error('Error updating user theme:', err);
        return null;
    }
};

gamesUserSchema.statics.updateUserHighScores = async function(userId, highScores) {
    try {
        return await this.updateOne({ _id: userId }, { $set: { high_scores: highScores } });
    } catch (err) {
        console.error('Error updating user high scores:', err);
        return null;
    }
};

gamesUserSchema.statics.getContinueGames = async function(userId) {
    try {
        const user = await this.findOne({ _id: userId }, { continuous_games: 1 });
        return user ? user.continuous_games : [];
    } catch (err) {
        console.error('Error getting user continue games:', err);
        return null;
    }
};
const GamesUser = mongoose.model('gamesUsers', gamesUserSchema);

module.exports = GamesUser;

