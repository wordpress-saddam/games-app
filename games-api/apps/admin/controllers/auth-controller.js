const AdminUsersModel = require('../../../core_libs/models/mongodb/db-admin-users');
const { generateToken } = require('../helpers/jwt-helper');
const { validatePasswordStrength } = require('../helpers/password-helper');
const apiExceptions = require('../../../config/api-exceptions').admin;

const register = async (req, res) => {
    try {
        const { email, password, name, role } = req.body;

        // Validate required fields
        if (!email || !password || !name) {
            return global.sendErrorResponse(res, false, 200, apiExceptions.validationFailed.code, apiExceptions.validationFailed.msg);
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return global.sendErrorResponse(res, false, 200, apiExceptions.invalidEmail.code, apiExceptions.invalidEmail.msg);
        }

        // Validate password strength
        const passwordValidation = validatePasswordStrength(password);
        if (!passwordValidation.isValid) {
            return global.sendErrorResponse(res, false, 200, apiExceptions.weakPassword.code, passwordValidation.errors.join(', '));
        }

        // Create admin user
        const user = await AdminUsersModel.createAdminUser(email, password, name, role || 'admin');

        if (!user) {
            return global.sendErrorResponse(res, false, 200, apiExceptions.registrationFailed.code, apiExceptions.registrationFailed.msg);
        }

        // Generate token
        const token = generateToken(user.id, user.email);

        return global.sendSuccessResponse(res, false, 200, {
            user,
            token
        });
    } catch (err) {
        console.log('Register error:', err);
        if (err.code) {
            return global.sendErrorResponse(res, false, 200, err.code, err.message);
        }
        return global.sendErrorResponse(res, false, 200, apiExceptions.registrationFailed.code, apiExceptions.registrationFailed.msg);
    }
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return global.sendErrorResponse(res, false, 200, apiExceptions.validationFailed.code, apiExceptions.validationFailed.msg);
        }

        const result = await AdminUsersModel.verifyPassword(email, password);

        if (!result.isValid) {
            if (result.errorCode === 'USER_NOT_FOUND') {
                return global.sendErrorResponse(res, false, 200, apiExceptions.userNotFound.code, 'User does not exist');
            } else if (result.errorCode === 'ACCOUNT_INACTIVE') {
                return global.sendErrorResponse(res, false, 200, apiExceptions.accountInactive.code, result.error);
            } else if (result.error) {
                return global.sendErrorResponse(res, false, 200, apiExceptions.invalidCredentials.code, result.error);
            }
            return global.sendErrorResponse(res, false, 200, apiExceptions.invalidCredentials.code, apiExceptions.invalidCredentials.msg);
        }

        // Update last login
        await AdminUsersModel.updateLastLogin(result.user.id);

        // Generate token
        const token = generateToken(result.user.id, result.user.email);

        return global.sendSuccessResponse(res, false, 200, {
            user: result.user,
            token
        });
    } catch (err) {
        console.log('Login error:', err);
        return global.sendErrorResponse(res, false, 200, apiExceptions.loginFailed.code, apiExceptions.loginFailed.msg);
    }
};

const getCurrentUser = async (req, res) => {
    try {
        const userId = req.user.userId;
        const user = await AdminUsersModel.loadOneByFilters({ _id: userId });

        if (!user) {
            return global.sendErrorResponse(res, false, 200, apiExceptions.userNotFound.code, apiExceptions.userNotFound.msg);
        }

        return global.sendSuccessResponse(res, false, 200, user);
    } catch (err) {
        console.log('Get current user error:', err);
        return global.sendErrorResponse(res, false, 200, apiExceptions.userNotFound.code, apiExceptions.userNotFound.msg);
    }
};

module.exports = {
    register,
    login,
    getCurrentUser
};

