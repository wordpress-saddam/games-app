const { Kinesis } = require('@aws-sdk/client-kinesis');

const awsConfig = require("../../../config/config").aws;

const kinesis = new Kinesis({
    credentials:{
        ...awsConfig.credentials
    },
    region: 'us-east-1',
})


const createStream = (options) => (
    new Promise((resolve, reject) => {

        kinesis.createStream({}, );
    })
)

const registerStreamConsumer = (ConsumerName, StreamARN) => (
    new Promise((resolve, reject) => {

        const params = {
            ConsumerName,
            StreamARN
        }

        kinesis.registerStreamConsumer(params, (err, data) => {
            if (err) {
                reject(err);
            } else {
                resolve(data)
            }
        });
    })
)

const getShardIterator = (ShardId, StreamName) => (
    new Promise((resolve, reject) => {

        const params = {
            ShardId,
            ShardIteratorType: "LATEST",
            StreamName,
        }
        kinesis.getShardIterator(params, (err, data) => {
            if (err) {
                reject(err);
            } else {
                resolve(data)
            }
        });
    })
)

const getRecords = (ShardIterator) => (
    new Promise((resolve, reject) => {

        const params = {
            ShardIterator,
        };

        kinesis.getRecords(params, (err, data) => {
            if (err) {
                reject(err);
            } else {
                resolve(data)
            }
        });
    })
)

module.exports = {
    createStream,
    registerStreamConsumer,
    getShardIterator,
    getRecords
}