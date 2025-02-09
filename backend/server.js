const express = require('express');
const cors = require('cors');
const OpenAI = require('openai');
const axios = require('axios'); // Add axios
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Configure OpenAI
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

// Function to call Ollama API
async function callOllama(message) {
    try {
        const response = await axios.post('http://localhost:11434/api/generate', {
            model: 'deepseek-r1:8b',
            prompt: message,
            stream: false
        }, {
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        // Clean up the response by removing <think> tags
        let cleanResponse = response.data.response
            .replace(/<think>\s*<\/think>/g, '')  // Remove empty think tags
            .replace(/<think>(.*?)<\/think>/g, '$1')  // Remove think tags but keep content
            .trim();  // Remove any extra whitespace
            
        return cleanResponse;
    } catch (error) {
        console.error('Ollama API Error:', error);
        throw error;
    }
}

// Function to call OpenAI API
async function callOpenAI(message) {
    try {
        const completion = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [{
                role: "user",
                content: message
            }],
        });
        return completion.choices[0].message.content;
    } catch (error) {
        console.error('OpenAI API Error:', error);
        throw error;
    }
}

// Chat endpoint
app.post('/api/chat', async (req, res) => {
    try {
        console.log('Received request body:', req.body);
        const { message, model = 'deepseek' } = req.body;
        console.log('Extracted model:', model, 'Type:', typeof model);

        let response;
        if (model === 'deepseek') {  // Changed == to === for strict comparison
            console.log('Using DeepSeek model');
            const ollamaResponse = await callOllama(message);
            response = {
                response: ollamaResponse,
                model: 'deepseek'
            };
        } else if (model === 'chatgpt') {  // Changed == to === for strict comparison
            console.log('Using ChatGPT model');
            const openaiResponse = await callOpenAI(message);
            response = {
                response: openaiResponse,
                model: 'chatgpt'
            };
        } else {
            console.log('Invalid model specified:', model);
            throw new Error(`Invalid model specified. Use either "deepseek" or "chatgpt". Received: ${model}`);
        }

        res.json(response);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            error: `Failed to get response from ${req.body.model || 'model'}`,
            details: error.message
        });
    }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
});
