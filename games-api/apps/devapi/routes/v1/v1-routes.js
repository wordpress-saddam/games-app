const gamesRoutes = require('./games-routes.js')
const authRoutes = require('./auth-routes')
const genAIRoutes = require('./genai-routes');
const verifyAccess = require('../../middlewares/verify-access');

const router = require('express').Router();


router
    .use('/auth', authRoutes)
    .use('/games',gamesRoutes)
    .use('/genai', verifyAccess, genAIRoutes)
    .get("/health-check-api",(req, res)=>{
        return res.status(200).json({
            status: true,
            message:"Devapi is working fine"
        })
    })

module.exports = router;
