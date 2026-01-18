const router = require('express').Router();
const genAIController = require('../../controllers/genai-controller.js');
// Dummy route handler that returns a test response
// const testGetConfigRoutes = (req, res) => {
//     res.json({
//         success: true,
//         message: "This is a dummy test response",
//         data: {
//             test: true,
//             timestamp: new Date().toISOString()
//         }
//     });
// };

router
    // .get('/games/generate-openai-games', testGetConfigRoutes)
    //.post('/games/generate-openai-games', genAIController.generateOpenAiGames)
    .post('/games/generate-vertexai-games', genAIController.generateVertexAiGames)
    
module.exports = router;