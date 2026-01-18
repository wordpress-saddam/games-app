const sendErrorResponse = (res, headers, respnoseCode, errorCode, message) => {
    if (headers) {
        res.set({
            ...headers
        })
    }

    res.status(respnoseCode).json({
        status: false,
        error: {
            errorCode,
            message
        }
    })
}

const sendSuccessResponse = (res, headers, respnoseCode, data ) => {
    if (headers) {
        res.set({
            ...headers
        })
    }
    console.log(respnoseCode)
    res.status(respnoseCode).json({
        status: true,
        data
    })
}

module.exports = {
    sendErrorResponse,
    sendSuccessResponse
}