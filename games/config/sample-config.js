require('dotenv').config();

const environments = {
    dev: "DEVELOPMENT",
    prod: "PRODUCTION",
    stag: "STAGING"
}
module.exports = {
    ENV: environments.prod,
    port: process.env.PORT || 3002,
    apps: {        
        devapi: {
            url: process.env.DEVPAPI_URL || "http://devapigames.asharq.site",
            paginationLimit: 10,    
            accessKey: "r7DEYlZAuCVdU4MoN7fKHT9xPovmhFnL",
            secretKey: "iQ1sFRdvVDSFZc2FBsUjjiUIDxxIbK68",
            projectPlatform: "pwa"
        },
    },
    jwt:{
        secret:"asharq@jwtsecret",
    }
}
