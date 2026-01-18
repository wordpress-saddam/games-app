const morgan = require('morgan');
const { sendSuccessResponse, sendErrorResponse } = require('../../../core_libs/utils/responses');
const express = require('express');

const loadLogger = (app) => {
    app.use(morgan((tokens, req, res) => {
        return [
            "Access ",
            tokens.method(req, res),
            tokens.url(req, res),
            tokens.status(req, res),
            tokens.res(req, res, 'content-length'), '-',
            tokens['response-time'](req, res), 'ms'
        ].join(' ')
    }));
}

const loadRequestParsers = (app) => {
    app.use(express.urlencoded({ extended: true }));
    app.use(express.json());
}

const createGlobals = (app) => {
    global.sendSuccessResponse = sendSuccessResponse;
    global.sendErrorResponse = sendErrorResponse;
}

module.exports = {
    loadLogger,
    loadRequestParsers,
    createGlobals
}

