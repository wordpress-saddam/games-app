const verifyQueryString = (req, res, next) => {
    if (req.query) {
        // Query string validation can be added here if needed
    }
    next();
};

const validatePagination = (req, res, next) => {
    const offset = parseInt(req.query.offset) || 0;
    const limit = parseInt(req.query.limit) || 10;

    if (offset < 0) {
        return global.sendErrorResponse(res, false, 400, 400, 'Offset must be non-negative');
    }

    if (limit < 1 || limit > 100) {
        return global.sendErrorResponse(res, false, 400, 400, 'Limit must be between 1 and 100');
    }

    req.pagination = {
        offset,
        limit
    };

    next();
};

module.exports = {
    verifyQueryString,
    validatePagination
};

