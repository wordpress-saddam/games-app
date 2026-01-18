const path = require('path');
const { VertexAI } = require('@google-cloud/vertexai');



const keyFilePath = path.join(__dirname, "../../../apps/devapi/vertex_ai_config.json")
const googleAuthOptions = {
    keyFilename: keyFilePath,
    scopes: ['https://www.googleapis.com/auth/cloud-platform'],
}
const vertexAI = new VertexAI({googleAuthOptions,project: 'asharqgames-uat', location: 'us-central1'});

module.exports = vertexAI;

