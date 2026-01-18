const mongoose = require('../../utils/database-connection').Mongoose;

const serviceStackSchema = new mongoose.Schema({
    name:{
        type:String,
        required: true
    },
    slug:{
        type: String,
        required: true,
        unique: true
    },
    region:{
        type:String
    },
    capacity:{
        type: Number,
        required: true
    },
    status:{
        type: String,
        enum: ["inactive","available", "locked"],
        default: "inactive"
    },
    classification:{
        type: Number,
        enum: [
            0,  //basic
            1,  //professional
            2,  //business
            3   //enterprise
        ],
        required: true
    },
    api_redis:{
        host: String,
        port: Number
    },
    turbo_redis:{
        host: String,
        port: Number
    },
    es_articles:{
        host: String,
        port: Number
    },
    cf_logs_bucket:{
        bucket_name: String,
        path_prefix: String
    },
    es_turbo_cflogs:{
        host: String,
        port: Number
    },
    route_cache_redis:{
        host: String,
        port: Number
    },
},{
    timestamps: true
})

module.exports = ServiceStackModel = mongoose.model('servicestacks', serviceStackSchema);