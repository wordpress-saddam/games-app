const { CloudFront } = require('@aws-sdk/client-cloudfront');

const path = require('path');
const awsConfig = require('../../../config/config').aws;
const defaultParams = require('./aws-default-params').cloudfront;
const {
    merge,
    reject
} = require("lodash");
const { log } = require('console');


const cloudFront = new CloudFront({
    credentials:{
        ...awsConfig.credentials
    },
    region:awsConfig.credentials.region,
    
});

const createCachePolicy = (options) => (
    new Promise((resolve, reject) => {

        const params = merge(defaultParams.cachePolicy, options);

        // resolve(params)
        cloudFront.createCachePolicy(params, (err, data) => {
            if (err) {
                reject(err);
            } else {
                resolve(data);
            }
        });
    })
);

const createOriginRequestPolicy = (options) => (
    new Promise((resolve, reject) => {

        const params = merge(defaultParams.originRequest, options);

        cloudFront.createOriginRequestPolicy(params, (err, data) => {
            if (err) {
                reject(err);
            } else {
                resolve(data);
            }
        });
    })
);

const createDistribution = (distributionConfig) => (
    new Promise((resolve, reject) => {

        const params = {
            DistributionConfigWithTags: {
                ...distributionConfig
            }
        }

        console.log(params)
        cloudFront.createDistributionWithTags(params, (err, data) => {
            if (err) {
                reject(err);
            } else {
                resolve(data);
            }
        });
    })
);

const createInvalidation = (options) => (
    new Promise((resolve, reject) => {

        cloudFront.createInvalidation(options, (err, data) => {
            if (err) {
                reject(err);
            } else {
                resolve(data);
            }
        });
    })
);

const listCachePolicies = (options) => (
    new Promise((resolve, reject) => {
        cloudFront.listCachePolicies(options, (err, data) => {
            if (err) {
                reject(err);
            } else {
                resolve(data);
            }
        });
    })
);


const listOriginRequestPolicies = (options) => (
    new Promise((resolve, reject)=>{
        
        cloudFront.listOriginRequestPolicies(options, (err, data)=>{
            if(err){
                reject(err);
            }else{
                resolve(data);
            }
        })
    })
)

const getCachePolicyConfig = (cachePolicyId) => (
    new Promise((resolve, reject) => {
        const params = {
            Id: cachePolicyId
        };
        cloudFront.getCachePolicyConfig(params, (err, data) => {
            if (err) {
                reject(err);
            } else {
                resolve(data);
            }
        });
    })
)


const getDistributionConfig = (distributionId) => (
    new Promise((resolve, reject) => {
        const params = {
            Id: distributionId
        };
        cloudFront.getDistributionConfig(params, (err, data) => {
            if (err) {
                reject(err);
            } else {
                resolve(data);
            }
        });
    })
)

const getOriginRequestPolicyConfig = (originRequestId) =>(
    new Promise((resolve, reject) => {
        const params = {
            Id: originRequestId
        }
        cloudFront.getOriginRequestPolicy(params,(err,data)=>{
            if(err){
                reject(err);
            }else{
                resolve(data);
            }
        })
    })
)


const createRealtimeLogConfig = () =>(
    new Promise((resolve, reject)=>{
        const params ={
            EndPoints: [ 
              {
                StreamType: 'STRING_VALUE', 
                KinesisStreamConfig: {
                  RoleARN: 'STRING_VALUE', 
                  StreamARN: 'STRING_VALUE'
                }
              },
            ],
            Fields: [],
            Name: 'STRING_VALUE',
            SamplingRate: 'NUMBER_VALUE'
          };



          cloudfront.createRealtimeLogConfig(params, function(err, data) {
            if (err) console.log(err, err.stack); // an error occurred
            else     console.log(data);           // successful response
          });
    })
)

const deleteDistribution = (distributionId) =>(
    new Promise((resolve, reject)=>{
        const params = {
            Id: distributionId
        }
        cloudFront.deleteDistribution(params,(err,data)=>{
            if(err){
                reject(err);
            }else{
                resolve(data);
            }
        })
    })
)

const updateDistribution = async(DistributionConfig)=>{
    return new Promise((resolve,reject)=>{

        const params = {
            ...DistributionConfig
        }

        console.log("params: ",params);
        cloudFront.updateDistribution(params,(err,data)=>{
            if(err){
                reject(err);
            }else{
                resolve(data);
            }
        });
    })
}

module.exports = {
    createCachePolicy,
    createOriginRequestPolicy,
    createDistribution,
    createInvalidation,
    listCachePolicies,
    listOriginRequestPolicies,
    getCachePolicyConfig,
    getDistributionConfig,
    getOriginRequestPolicyConfig,
    createRealtimeLogConfig,
    deleteDistribution,
    updateDistribution,
}