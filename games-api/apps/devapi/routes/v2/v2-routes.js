// const categoryRoutes = require("./category-routes");
// const wpWebstoryRoutes = require("./wp-webstory-routes");
// const articleRoutes = require("./article-routes");
// const authorRoutes = require("./author-routes");
// const authRoutes = require('./auth-routes');
// const ssoRoutes = require("./sso-routes");
// const configRoutes = require('./config-routes');
// console.log("v2-routes here..");
const router = require("express").Router();

// Dummy route handler that returns a test response
const testGetConfigRoutes = require("express").Router();
testGetConfigRoutes.get('/', (req, res) => {
    res.json({
        success: true,
        message: "This is a dummy test response",
        data: {
            test: true,
            timestamp: new Date().toISOString()
        }
    });
});

router
    // .use('/auth', authRoutes)
    // .use("/articles", articleRoutes)
    // .use("/category", categoryRoutes)
    // .use("/wpwebstories", wpWebstoryRoutes)
    // .use("/authors", authorRoutes)
    // .use("/sso", ssoRoutes)
    // .use('/config', configRoutes)
    .use('/test', testGetConfigRoutes)
    .use('/get-config', testGetConfigRoutes)


module.exports = router;
