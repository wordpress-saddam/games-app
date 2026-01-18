const redis = require('redis');
const redisConfig = require('../../../config/config').redis;
const client = redis.createClient(redisConfig.port,redisConfig.host);

client.on('connect', ()=>{
    console.log("Connected to redis server")
})

client.on('error', (err) => {
    console.log("Error in connecting with Redis server");
    console.log(err.message || err);
    // Don't crash the process, just log the error
})

module.exports = client;