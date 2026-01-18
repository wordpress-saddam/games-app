const { CognitoIdentity } = require('@aws-sdk/client-cognito-identity');

const path = require('path');
const awsConfig = require("../../../config/config").aws;
const defaultParams = require('./aws-default-params').acm;

const cognito = new CognitoIdentity({
    credentials:{
        ...awsConfig.credentials
    },
    region:'ap-south-1'
})

const verifyIdentity = (aws_identity) =>(   
        new Promise((resolve, reject)=>{
            const params = {
                IdentityId: aws_identity
            }

            cognito.describeIdentity(params, (err, data)=>{
                if(err){
                    console.log(err)
                    reject(err)
                }else{
                    console.log(data)
                    resolve(data)
                }
            })
        })
    
)

// verifyIdentity("ap-south-1:5ebf3ab9-de05-4f81-8fea-41b9985d9617").then(data=>{
//     console.log(data)
// }).catch(err=>{
//     console.log(err)
// })

module.exports = {
    verifyIdentity
}
    
