const {
    devCredentials
} = require('../temp/dev-cred');

const verifyCredentials = (credentilas) => {
    let isValid = false;
    for(let i=0;i<devCredentials.length;i++){
        if (devCredentials[i].accessKey === credentilas.accessKey && devCredentials[i].secretKey === credentilas.secretKey) {
            isValid = true;
            token = devCredentials[i].token;
            break;
        }
    }
    return isValid;
}

module.exports = {
    verifyCredentials
}