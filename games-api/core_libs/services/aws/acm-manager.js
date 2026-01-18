
const { ACM } = require('@aws-sdk/client-acm');

const path = require('path');
const awsConfig = require("../../../config/config").aws;
const defaultParams = require('./aws-default-params').acm;

const acm = new ACM({
    credentials:{
        ...awsConfig.credentials,
    },
    region:'us-east-1'
})


const requestCertificate = (options) => (

    new Promise ((resolve, reject)=>{

        const params = {
            ...defaultParams.requestCertificate,
            ...options
        }

        console.log(params)
        acm.requestCertificate(params, (err, data) => {
            if(err){
                reject(err);
            }else{
                resolve(data);
            }
        });
    })
)

//possible values
    // PENDING_VALIDATION
    //SUCCESS
    //FAILED

const checkCertificateStatus = (certificateArn) =>(

    new Promise((resolve, reject)=>{
        const params = {
            CertificateArn: certificateArn
        }

        acm.describeCertificate(params, (err, data)=>{
            if(err){
                reject(err)
            }else{
                resolve(data.Certificate.Status)
            }
        })
    })
)


const getCertificateDetails = (certificateArn) =>(

    new Promise((resolve, reject)=>{
        const params = {
            CertificateArn: certificateArn
        }

        acm.describeCertificate(params, (err, data)=>{
            if(err){
                reject(err)
            }else{
                resolve(data.Certificate.DomainValidationOptions)
            }
        })
    })
)

const deleteACMCertificate = (certificateArn) =>(
    new Promise((resolve, reject)=>{
        const params = {
            CertificateArn: certificateArn
        }
        console.log(params, "params")
        acm.deleteCertificate(params, (err, data)=>{
            if(err){
                reject(err)
            }else{
                resolve(data)
            }
        })
    })
)
// checkCertificateStatus("arn:aws:acm:us-east-1:412763568157:certificate/4b915858-2304-45f2-8d00-28c6b322b1e4").then(data=>{
//     console.log(data)
// }).catch(err=>{
//     console.log(err)
// })

module.exports = {
    requestCertificate,
    checkCertificateStatus,
    getCertificateDetails,
    deleteACMCertificate
}
    
