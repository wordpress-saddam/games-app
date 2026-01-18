const client = require('./redis-head')
const {
    ttl
} = require('../../../config/config').redis;

const setElementValue = (key, value) =>{
    return new Promise((resolve, reject) =>{

        client.set(key, value, (err, reply)=>{
            if (err) {
                return reject(false)
            } else {
                return resolve(true)
            }
        })
        client.expire(key, ttl);
    })
}

const getElementValue = (key) =>{
    return new Promise((resolve, reject)=>{
        client.get(key, (err, reply)=>{
            if (err) {
                return reject(false)
            } else {
                return resolve(reply)
            }
        })
    })
}

module.exports = {
    setElementValue,
    getElementValue
}