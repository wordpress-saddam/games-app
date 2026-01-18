const mongoose = require('../../utils/database-connection').Mongoose;
const errorCodes = require('../../../config/error-codes').adminUsers;
const bcrypt = require('bcrypt');

const adminUsersSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        required: true
    },
    name: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ['admin', 'editor'],
        default: 'admin'
    },
    status: {
        type: Number,
        enum: [0, 1], // 0=inactive, 1=active
        default: 1
    },
    last_login: {
        type: Date
    }
}, {
    timestamps: true
});

adminUsersSchema.methods.getPublicObject = function () {
    return {
        id: this._id,
        email: this.email,
        name: this.name,
        role: this.role,
        status: this.status,
        last_login: this.last_login,
        created_at: this.createdAt,
        updated_at: this.updatedAt
    };
};

adminUsersSchema.statics.createAdminUser = async function (email, password, name, role = 'admin') {
    try {
        // Check if user already exists
        const existingUser = await this.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            throw {
                code: errorCodes.alreadyExists,
                message: 'Admin user with this email already exists'
            };
        }

        // Hash password
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        const adminUser = new AdminUsersModel({
            email: email.toLowerCase(),
            password: hashedPassword,
            name,
            role
        });

        const savedUser = await adminUser.save();
        return savedUser ? savedUser.getPublicObject() : null;
    } catch (err) {
        if (err.code) {
            throw err;
        }
        var errorData = [];
        if (err.errors) {
            for (item in err.errors) {
                errorData.push({
                    field: err.errors[item].path,
                    message: err.errors[item].message
                });
            }
        }
        const error = {
            code: errorCodes.validationFailed,
            message: 'Validation Failed',
            errorData: errorData
        };
        throw error;
    }
};

adminUsersSchema.statics.findByEmail = async function (email) {
    try {
        const user = await this.findOne({ email: email.toLowerCase() }).exec();
        return user;
    } catch (err) {
        console.log(err);
        throw err;
    }
};

adminUsersSchema.statics.verifyPassword = async function (email, password) {
    try {
        const user = await this.findOne({ email: email.toLowerCase() }).exec();
        if (!user) {
            return { isValid: false, user: null, error: 'User does not exist', errorCode: 'USER_NOT_FOUND' };
        }

        if (user.status === 0) {
            return { isValid: false, user: null, error: 'User account is inactive', errorCode: 'ACCOUNT_INACTIVE' };
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (isPasswordValid) {
            return { isValid: true, user: user.getPublicObject() };
        }
        return { isValid: false, user: null, error: 'Invalid password', errorCode: 'INVALID_PASSWORD' };
    } catch (err) {
        console.log(err);
        throw err;
    }
};

adminUsersSchema.statics.updateLastLogin = async function (userId) {
    try {
        await this.findByIdAndUpdate(userId, { last_login: new Date() });
        return true;
    } catch (err) {
        console.log(err);
        throw err;
    }
};

adminUsersSchema.statics.loadOneByFilters = async function (filters = {}) {
    try {
        const user = await this.findOne(filters).exec();
        return user ? user.getPublicObject() : null;
    } catch (err) {
        console.log(err);
        throw err;
    }
};

module.exports = AdminUsersModel = mongoose.model('adminusers', adminUsersSchema);

