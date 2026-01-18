const { Comprehend } = require('@aws-sdk/client-comprehend');
const { Translate } = require('@aws-sdk/client-translate');

const path = require('path');
const awsConfig = require("../../../config/config").aws;

const comprehend = new Comprehend({
    credentials:{
        ...awsConfig.credentials
    },
    region:awsConfig.credentials.region
})

const translationClient = new Translate({
    credentials:{
        ...awsConfig.credentials
    },
    region:awsConfig.credentials.region
})

const extractEntities = (text) =>(

    new Promise((resolve, reject)=>{
        const params = {
            Text: text,
            LanguageCode :'en'
        }

        comprehend.detectEntities(params, (err, data)=>{
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

const translateText = (text, sourceLanguage, targetLanguage) =>(

    new Promise((resolve, reject)=>{
        const params = {
            Text: text,
            SourceLanguageCode :sourceLanguage,
            TargetLanguageCode: targetLanguage
        }

        translationClient.translateText(params, (err, data)=>{
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


const extractSentiments = (text) =>(

    new Promise((resolve, reject)=>{
        const params = {
            Text: text,
            LanguageCode :'en'
        }

        comprehend.detectSentiment(params, (err, data)=>{
            if(err){
                reject(err)
            }else{
                resolve(data)
            }
        })
    })
)

module.exports = {
    extractEntities,
    translateText,
    extractSentiments
}

    