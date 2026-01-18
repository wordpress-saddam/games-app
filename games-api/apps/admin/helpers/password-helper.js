const bcrypt = require('bcrypt');

const SALT_ROUNDS = 10;

/**
 * Hash password using bcrypt
 * @param {string} password - Plain text password
 * @returns {Promise<string>} - Hashed password
 */
const hashPassword = async (password) => {
    try {
        const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
        return hashedPassword;
    } catch (err) {
        console.error('Error hashing password:', err);
        throw err;
    }
};

/**
 * Compare password with hash
 * @param {string} password - Plain text password
 * @param {string} hash - Hashed password
 * @returns {Promise<boolean>} - True if password matches
 */
const comparePassword = async (password, hash) => {
    try {
        const isMatch = await bcrypt.compare(password, hash);
        return isMatch;
    } catch (err) {
        console.error('Error comparing password:', err);
        throw err;
    }
};

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @returns {Object} - { isValid: boolean, errors: [] }
 */
const validatePasswordStrength = (password) => {
    const errors = [];
    const config = require('../../../config/config').apps.admin;
    let isContainsErrors = false;

    if (!password || typeof password !== 'string') {
        if (errors.length === 0) {
            errors.push('Password is required');
        }else{
            errors.push(', and required');
        }
        return { isValid: false, errors };
    }

    const minLength = config.passwordMinLength || 8;

    if (password.length < minLength) {
        if (errors.length === 0) {
            errors.push(`Password must be at least ${minLength} characters long`);
        }else{
            errors.push('and must be at least ${minLength} characters long');
        }
    }

    if (!/[a-z]/.test(password)) {
        if (errors.length === 0) {
            errors.push('Password must contain at least one lowercase letter');
        }else if(!isContainsErrors){
            isContainsErrors = true;
            errors.push('and must contain at least one lowercase letter');
        } else{
            errors.push('one lowercase letter');
        }
    }

    if (!/[A-Z]/.test(password)) {
        if (errors.length === 0) {
            errors.push('Password must contain at least one uppercase letter');
        }else if(!isContainsErrors){
            isContainsErrors = true;
            errors.push('and must contain at least one uppercase letter');
        } else{
            errors.push('one uppercase letter');
        }
    }

    if (!/[0-9]/.test(password)) {
        if (errors.length === 0) {
            errors.push('Password must contain at least one number');
        }else if(!isContainsErrors){
            isContainsErrors = true;
            errors.push('and must contain at least one number');
        } else{
            errors.push('and one number');
        }
    }

    return {
        isValid: errors.length === 0,
        errors
    };
};

module.exports = {
    hashPassword,
    comparePassword,
    validatePasswordStrength
};

