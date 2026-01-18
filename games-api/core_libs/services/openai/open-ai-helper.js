const OpenAI = require('openai');
const config = require('../../../config/config');

var OpenAIClient = null;
if(config?.openaiCredentials?.apiKey) {
  OpenAIClient = new OpenAI({
    apiKey: config?.openaiCredentials?.apiKey
  });
}else {
  console.log("WARNING: openaiCredentials is missing in config");
}

module.exports = OpenAIClient;
