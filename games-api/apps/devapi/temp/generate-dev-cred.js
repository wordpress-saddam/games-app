const fs = require('fs');
const sampleString ="abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
const sampleLength = sampleString.length

console.log(sampleLength)

const generateRandomKey = length =>{
    let key = "";

    while(length>0){
        key+= sampleString[Math.floor(Math.random()*sampleLength)];
        length--;
    }
    return key;
}

let data = "module.exports={devCredentials:["

for(let i =0; i<50;i++){
    data += "{"
    data += `   accessKey: "${generateRandomKey(32)}",\n`;
    data += `   secretKey: "${generateRandomKey(32)}",\n`;
    data += `   token: "${generateRandomKey(16)}"`
    data += "},\n";
}

data += "]}"

fs.writeFile('dev-cred.js', data, (err)=>{
    if(err){
        console.log(err);
    }else{
        console.log("file written successfully")
    }
})