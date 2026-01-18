const { SES } = require('@aws-sdk/client-ses');

const awsConfig = require("../../../config/config").aws;

// AWS.config.update(awsConfig.credentials);
//AWS.config.update({...awsConfig.credentials,region:'us-east-1'});


const ses = new SES({
    credentials:{
        ...awsConfig.credentials,
    },
    region: awsConfig.credentials.region,
});

const sendEmail = (params) => (
    new Promise((resolve,reject)=>{
        ses.sendEmail(params,(err,data) => {
            if(err){
                console.log(err);
                return reject(err);
            }else{
                console.log(data.MessageId);
                return resolve(data.MessageId);
            }
        })
    })
)

const sendRawEmail = (params) => (
    new Promise((resolve,reject)=>{
        ses.sendRawEmail(params,(err,data) => {
            if(err){
                console.log(err);
                return reject(err);
            }else{
                console.log(data.MessageId);
                return resolve(data.MessageId);
            }
        })
    })
)

module.exports = {
    sendEmail,
    sendRawEmail
}