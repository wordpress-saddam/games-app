const openAI = require('../../services/openai/open-ai-helper');

const getGames =  async (prompt) => {
    try{
        const response = await openAI.chat.completions.create({
            messages: [{ role: 'user', content: prompt }],
            model: 'gpt-4o',
            response_format : {
                "type": "json_schema",
                "json_schema": {
                    "name": "GamesSchema",
                    "strict": true,
                    "schema": {
                        "type": "object",
                        "properties": {
                            "headline_shuffle": {
                                "type": "object",
                                "properties": {
                                    "randomized": {
                                        "type": "array",
                                        "items": {
                                            "type": "string"
                                        }
                                    },
                                    "status": {
                                        "type": "boolean"
                                    }
                                },
                                "required": [
                                    "randomized",
                                    "status"
                                ],
                                "additionalProperties": false
                            },
                            "quiz": {
                                "type": "object",
                                "properties": {
                                    "data": {
                                        "type": "object",
                                        "properties": {
                                            "questions": {
                                                "type": "array",
                                                "items": {
                                                    "type": "object",
                                                    "properties": {
                                                        "a": {
                                                            "type": "string"
                                                        },
                                                        "answer": {
                                                            "type": "string"
                                                        },
                                                        "b": {
                                                            "type": "string"
                                                        },
                                                        "c": {
                                                            "type": "string"
                                                        },
                                                        "d": {
                                                            "type": "string"
                                                        },
                                                        "question": {
                                                            "type": "string"
                                                        }
                                                    },
                                                    "required": [
                                                        "a",
                                                        "answer",
                                                        "b",
                                                        "c",
                                                        "d",
                                                        "question"
                                                    ],
                                                    "additionalProperties": false
                                                }
                                            }
                                        },
                                        "required": [
                                            "questions"
                                        ],
                                        "additionalProperties": false
                                    },
                                    "status": {
                                        "type": "boolean"
                                    }
                                },
                                "required": [
                                    "data",
                                    "status"
                                ],
                                "additionalProperties": false
                            }
                        },
                        "required": [
                            "headline_shuffle",
                            "quiz"
                        ],
                        "additionalProperties": false,
                        "$schema": "http://json-schema.org/draft-07/schema#"
                    }
                }
            }
          });
        console.log("Response from OpenAI:",JSON.stringify(response, undefined, 5));
        return response;
    }catch(err){
        console.log(err);
        throw err;
    }
}



const generateGamesOpenAI = async (content, headline) => {
    try{
        const prompt = ` Headline : ${headline}
        Content : ${content}
        Analyze the sentiment of the headline. 
        If the sentiment is positive, generate the following:
        1. Given the headline:  After splitting it into 5 part (Do not skip any word fron headline, If i merge random word at correct position , it should be exact same as headline given), randomize their order and output the result in a JSON format. The output should include 'status' (true/false) to indicate if the task was successful, and a 'randomized' list containing the shuffled parts of the headline. Do not remove or distort any special characters. Each part should remain intact and meaningful in context. The final output should be formatted as: { 'status': true/false, 'randomized': [...] }.
        2. Please Consider the below array:
        array1 = [{"question": "What was the score of India's batting innings?", "a": "243-5", "b": "326-5", "c": "302-5", "d": "155-10","answer": "b"},{"question": "Who was India's top scorer in the match?", "a": "Rohit Sharma", "b": "Shreyas Iyer", "c": "Virat Kohli", "d": "Ravindra Jadeja", "answer": "c"},{"question": "How many wickets did Ravindra Jadeja take?", "a": "3", "b": "5", "c": "8", "d": "10", "answer": "b"},{"question": "Which team suffered a collapse and were dismissed for 83?", "a": "India", "b": "Sri Lanka", "c": "Netherlands", "d": "South Africa", "answer": "d"},{"question": "When will India complete their match against the Netherlands?", "a": "November 6", "b": "November 12", "c": "November 19", "d": "Doesn't mention", "answer": "b"}]";
        Create a valid JSON array of objects as a response just like the above array1, listing in total 5 multiple-choice questions with 4 options each in content language from the below mentioned content. All the questions should be related to the Content Provided.
        If the sentiment is not positive, do not generate any games and return { status: false, message: "The sentiment of the headline is not positive." } instead.`;
        const response = await getGames(prompt);

        if(response?.choices?.[0].finish_reason  === 'stop') {
            const text = response?.choices?.[0].message.content;
            const games = JSON.parse(text);
            return games;
        }
        return false;
    }catch(err){
      console.log("Err:",err)
      return false;
    }
  }
  
  
  
  const generateGames = async (data) => {
    try {
        let games = await generateGamesOpenAI(data.content, data.headline);
        
        return games;
    }catch(err){
      console.log(err)
      return false;
    }
  }
  





module.exports = {
    generateGames
}

// const prompt =  `Headline :  "Man Plants 1 Lakh Trees, Transforming Barren Land & Inspiring a Village To Embrace Green Living"
// Content : “The best time to plant a tree was 20 years ago. The second best time is now.”

// In the serene village of Sirkot, tucked away in the picturesque Bageshwar district of Uttarakhand, lives a 60-year-old farmer whose life story is an inspiring testament to perseverance, dedication, and environmental stewardship. Jagdish Chandra Kuniyal’s passion for the environment has not only transformed his own life but has uplifted his community. 

// For over four decades, he has worked tirelessly to revive his land, plant trees, and create a sustainable future, despite countless challenges. His work came to national attention when Prime Minister Narendra Modi, in his programme, Mann Ki Baat, praised Jagdish’s efforts, a recognition that brought both joy and a sense of fulfilment to the humble farmer.
// Jagdish’s journey began in the shadow of personal loss. He lost his father at the age of 18, a pivotal moment in his life that left a deep impact. The tragedy could have crushed him, but instead, it became the catalyst for a life built around resilience and a deep connection to the earth. 
// “At the age of 20, I made a firm decision to honour my father’s legacy by doing something meaningful with the land he had left behind,” he tells The Better India. In addition to managing his family’s farm, Jagdish also runs a small ration shop, which serves as another way he contributes to his village’s livelihood.
// From disappointment to triumph
// In 1990, with no formal training but an unshakeable desire to improve his circumstances, Jagdish set out on a mission to plant fruit trees on his land. He began by planting guava and walnut trees, confident that these fruit-bearing trees would thrive and provide a good yield. But, like many ventures, things didn’t go as planned.

// Analyze the sentiment of the headline.
// If the sentiment is positive, generate the following:
// 1. Given the headline: After splitting it into 5 part (Do not skip any word from headline, If i merge random word at correct position , it should be exact same as headline given), randomize their order and output the result in a JSON format. The output should include 'status' (true/false) to indicate if the task was successful, and a 'randomized' list containing the shuffled parts of the headline. Do not remove or distort any special characters. Each part should remain intact and meaningful in context. The final output should be formatted as: { 'status': true/false, 'randomized': [...] }.
// 2. Please Consider the below array:
// array1 = [{"question": "What was the score of India's batting innings?", "a": "243-5", "b": "326-5", "c": "302-5", "d": "155-10","answer": "b"},{"question": "Who was India's top scorer in the match?", "a": "Rohit Sharma", "b": "Shreyas Iyer", "c": "Virat Kohli", "d": "Ravindra Jadeja", "answer": "c"},{"question": "How many wickets did Ravindra Jadeja take?", "a": "3", "b": "5", "c": "8", "d": "10", "answer": "b"},{"question": "Which team suffered a collapse and were dismissed for 83?", "a": "India", "b": "Sri Lanka", "c": "Netherlands", "d": "South Africa", "answer": "d"},{"question": "When will India complete their match against the Netherlands?", "a": "November 6", "b": "November 12", "c": "November 19", "d": "Doesn't mention", "answer": "b"}]";
// Create a valid JSON array of objects as a response just like the above array1, listing in total 5 multiple-choice questions with 4 options each in content language from the below mentioned content. All the questions should be related to the Content Provided.
// If the sentiment is not positive, do not generate any games and return { status: false, message: "The sentiment of the headline is not positive." } instead.`

// generateGames(prompt).then().catch();