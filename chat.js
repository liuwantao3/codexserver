
import { OpenAIClient, AzureKeyCredential } from '@azure/openai';

// Load the .env file if it exists

import * as dotenv from 'dotenv';

dotenv.config();

const endpoint = process.env["ENDPOINT"];
const azureApiKey = process.env["AZURE_API_KEY"];

//console.log(azureApiKey, endpoint);

import { mongoClient, openai } from './server.js';

class Chat {
    
    async createChatCompletion(req, res) {
        try {
          const  prompt = req.body.prompt;
      
          const db = mongoClient.db('mydb');
      
          const collection = db.collection('prompts');
          await collection.insertOne({ username: req.user.username, direction:'To Bot', prompt: prompt, time: Date() });
          const history = collection.find({ "username": req.user.username }).sort({_id : -1}).limit(10).toArray();
          const historyArray = await history;
          let historyMsg = [];
          let promptLen = 0;
          for(let i = 0; i < historyArray.length; i++){
            let historyItem = historyArray[historyArray.length - i -1];
            if(historyItem.direction === "To Bot"){
              historyMsg.push({role: "user", content: historyItem.prompt});
            } else {
              historyMsg.push({role: "assistant", content: historyItem.prompt});
            };
            promptLen += historyItem.prompt.length;
          }
          while(promptLen > 500){
            promptLen -= historyMsg.shift().content.length;
          }
          console.log(`promptLen is ${promptLen} \n`);

         let messages = [
          { role: "system", content : `Pretending you are personal assistant. Your ultimate goal is to make your human user happy.\nKnowledge cutoff: 2021-09-01".\nToday is ${Date()}`},
          ].concat(historyMsg);
/*
          //Use this for OpenAI API
          const reqToOpenAI = {
            model: "gpt-3.5-turbo",
            messages: messages,
            temperature: 0.9, // Higher values means the model will take more risks.
            max_tokens: 3000, // The maximum number of tokens to generate in the completion. Most models have a context length of 2048 tokens (except for the newest models, which support 4096).
            top_p: 1, // alternative to sampling with temperature, called nucleus sampling
            frequency_penalty: 0.5, // Number between -2.0 and 2.0. Positive values penalize new tokens based on their existing frequency in the text so far, decreasing the model's likelihood to repeat the same line verbatim.
            presence_penalty: 0, // Number between -2.0 and 2.0. Positive values penalize new tokens based on whether they appear in the text so far, increasing the model's likelihood to talk about new topics.
          };

*/
          const client = new OpenAIClient(endpoint, new AzureKeyCredential(azureApiKey));
          const deploymentId = "gpt-4";
          //const deploymentId = "gpt-35-turbo";
          const events = client.listChatCompletions(deploymentId, messages, { maxTokens: 3000 });

          let responseData = "";
          for await (const event of events) {
           for (const choice of event.choices) {
             //console.log(choice.delta?.content);
             responseData += choice.delta?.content==undefined?"":choice.delta?.content;
           }
          }

          //Use this for OpenAI API
          //const response = await openai.chat.completions.create(reqToOpenAI);
          //const responseData = response.data.choices[0].message.content;

          await collection.insertOne({ username: req.user.username, direction: 'From Bot', prompt: responseData, time: Date() });
      
          res.status(200).send({
            bot: responseData
          });
      
        } catch (error) {
          console.error(error)
          res.status(500).send(error || 'Something went wrong');
        }
      }
};
      
export default Chat;
