const {
    AccessDeniedException,
    BedrockRuntimeClient,
    InvokeModelCommand,
} = require('@aws-sdk/client-bedrock-runtime');

const awsConfig = require("../../../config/config").aws;
const REGION = 'us-east-1';
const client = new BedrockRuntimeClient({
    credentials : awsConfig.credentials,
    region: REGION
});

const generateContent = async (prompt) => {
    const modelId = "amazon.titan-text-express-v1";
  
    /* The different model providers have individual request and response formats.
     * For the format, ranges, and default values for Titan text, refer to:
     * https://docs.aws.amazon.com/bedrock/latest/userguide/model-parameters-titan-text.html
     */
    const textGenerationConfig = {
      maxTokenCount: 4096,
      stopSequences: [],
      temperature: 0,
      topP: 1,
    };
  
    const payload = {
      inputText: prompt,
      textGenerationConfig,
    };
  
    const command = new InvokeModelCommand({
      body: JSON.stringify(payload),
      contentType: "application/json",
      accept: "application/json",
      modelId,
    });
  
    try {
      const response = await client.send(command);
      const decodedResponseBody = new TextDecoder().decode(response.body);
      const responseBody = JSON.parse(decodedResponseBody);
      console.log(responseBody);
      return responseBody;
    } catch (err) {
        console.log(err);
      if (err instanceof AccessDeniedException) {
        console.error(
          `Access denied. Ensure you have the correct permissions to invoke ${modelId}.`,
        );
      } else {
        throw err;
      }
    }
  };

module.exports = {
  generateContent
}