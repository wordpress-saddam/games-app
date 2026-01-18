require('dotenv').config();

const environments = {
    dev: "DEVELOPMENT",
    prod: "PRODUCTION",
    stag: "STAGING"
}
module.exports = {
    ENV: environments.dev,
    apps: {
        devapi: {
            port: 5002,
            url: process.env.DEVPAPI_URL || "http://localhost:5002/",
            paginationLimit: 10,
        },
        admin: {
            port: 5007,
            jwtSecret: process.env.ADMIN_JWT_SECRET || 'admin-secret-key-change-in-production',
            jwtExpiry: '24h',
            passwordMinLength: 8,
            defaultImportInterval: 60
        }
    },
    
    database: {
        host: process.env.DB_HOST || '127.0.0.1',
        port: parseInt(process.env.DB_PORT) || 27017,
        db: process.env.DB_NAME || 'dbname',
        username: process.env.DB_USERNAME || 'username',
        password: process.env.DB_PASSWORD || 'pwd',
        authSource: process.env.DB_AUTH_SOURCE || 'admin'      
    },
        
    aws: {        
        credentials: {
            "accessKeyId": "ACCESSKEYID",
            "secretAccessKey": "SECRETACCESSKEY",
            "region": "ap-south-1"
        },        
        hostedZoneId: "Z0NEID",        
    },
    google: {
        clientID: "GCPCLIENTID",
        clientSecret: "GCPSECRET"
    },
   keycloak: {
        clientID: "asharq-gameshub",
        clientSecret: "AoDoGJEaqLxiy0KWuDQEjRkCCoOL7fCU",
        authorizationURL: "https://auth.asharq.com/realms/staging/protocol/openid-connect/auth",
        tokenURL: "https://auth.asharq.com/realms/staging/protocol/openid-connect/token",
        userInfoURL: "https://auth.asharq.com/realms/staging/protocol/openid-connect/userinfo",
        callbackURL: (process.env.DEVPAPI_URL || '').replace(/\/$/, '') + "/v1/auth/keycloak/callback",
        logoutURL: "https://auth.asharq.com/realms/staging/protocol/openid-connect/logout",
        issuer: "https://auth.asharq.com/realms/staging"
    },

    elastic: {
        hosts: process.env.ELASTIC_HOSTS ? process.env.ELASTIC_HOSTS.split(',').map(h => h.trim()) : [
            'http://127.0.0.1:9200/'
        ]

    },
    redis: {
        host: process.env.REDIS_HOST || '127.0.0.1',
        port: process.env.REDIS_PORT || '6379',
        devapiKeyPrefix: "DA:",
        ttl: 1800,
        cacheListPrefix: {
            article: "DA:CACHE:ARTICLE_LIST:",
            config: "DA:CACHE:CONFIG_LIST:",
        }
    },
    apm: {
        devapi: {
            enable: false,
            service_name: "devapi",
            server_url: "http://127.0.0.1:8200"
        },        
        admin: {
            enable: false,
            service_name: "admin",
            server_url: "http://127.0.0.1:8200"
        }
    },    

    jwt: {
        secret: process.env.JWT_SECRET || "asharq-games-jwt-secret-key-change-in-production",
        expiration: process.env.JWT_EXPIRATION || "15m"
    },
    frontendUrl: process.env.FRONTEND_URL || "http://localhost:8080",
    backendUrl: process.env.BACKEND_URL || "http://localhost:5002",
    serviceStackId:'626bd60cceca7f370a882eb0',
    projectId:'694531970d0532889400d79c',
    googleReturnUrl: process.env.GOOGLE_RETURN_URL || "http://localhost:8080"
}
