/**
 * Notes Generation Service
 * Handles generation of structured notes from transcriptions using AI
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

class NotesGenerationService {
    /**
     * Generate structured notes from a transcription
     * @param {string} transcription - The transcribed text
     * @param {object} options - Options for note generation
     * @returns {Promise<string>} - The generated notes in markdown format
     */
    async generateNotes(transcription, options = {}) {
        const {
            apiProvider = 'default',
            model = process.env.API_MODEL || 'gemini-2.0-flash',
            apiKey = process.env.API_KEY,
            apiEndpoint = process.env.API_BASE_URL || 'https://generativelanguage.googleapis.com/v1beta/openai/',
            apiModelName = '',
            title = 'Lecture Notes',
            includeTimestamps = false,
        } = options;
        
        try {
            switch (apiProvider) {
                case 'default':
                    return this.generateWithDefault(transcription, apiKey, apiEndpoint, model, title);
                case 'custom':
                    return this.generateWithCustom(transcription, apiKey, apiEndpoint, apiModelName || model, title);
                case 'openai':
                    return this.generateWithOpenAI(transcription, model, apiKey, title);
                case 'anthropic':
                    return this.generateWithAnthropic(transcription, model, apiKey, title);
                case 'local':
                    return this.generateWithLocalModel(transcription, model, title);
                case 'ollama':
                    return this.generateWithOllama(transcription, model, title);
                default:
                    throw new Error(`Unsupported API provider: ${apiProvider}`);
            }
        } catch (error) {
            console.error('Error generating notes:', error);
            throw new Error(`Notes generation failed: ${error.message}`);
        }
    }
    
    /**
     * Generate notes using default provider (Gemini with OpenAI-compatible API)
     * Uses environment variables for configuration
     * @param {string} transcription - The transcribed text
     * @param {string} apiKey - The API key
     * @param {string} apiEndpoint - The API endpoint URL
     * @param {string} model - The model to use
     * @param {string} title - The title for the notes
     * @returns {Promise<string>} - The generated notes
     */
    async generateWithDefault(transcription, apiKey, apiEndpoint, model, title) {
        if (!apiKey) {
            throw new Error('API key is required in .env file (API_KEY)');
        }
        
        try {
            // Use OpenAI-compatible endpoint for Gemini
            let endpoint = apiEndpoint;
            if (!endpoint.endsWith('/')) {
                endpoint += '/';
            }
            
            const response = await axios.post(
                `${endpoint}chat/completions`,
                {
                    model,
                    messages: [
                        {
                            role: 'system',
                            content: `You are an expert teaching assistant that creates well-structured, comprehensive notes from lecture transcriptions. 
                                     Format the output in markdown with clear headings, bullet points, and formatting. 
                                     Organize the content logically, highlighting key concepts, definitions, examples, and important points.
                                     Include a summary section at the end.`
                        },
                        {
                            role: 'user',
                            content: `Please create comprehensive, well-structured lecture notes from the following transcription. 
                                     Title the notes: "${title}".
                                     \n\n${transcription}`
                        }
                    ],
                    temperature: 0.3,
                    max_tokens: 4000,
                },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${apiKey}`
                    }
                }
            );
            
            return response.data.choices[0].message.content;
        } catch (error) {
            console.error('Default API error:', error.response?.data || error.message);
            throw new Error(`Default API error: ${error.response?.data?.error?.message || error.message}`);
        }
    }
    
    /**
     * Generate notes using custom API provider
     * @param {string} transcription - The transcribed text
     * @param {string} apiKey - The API key
     * @param {string} apiEndpoint - The API endpoint URL
     * @param {string} modelName - The model name
     * @param {string} title - The title for the notes
     * @returns {Promise<string>} - The generated notes
     */
    async generateWithCustom(transcription, apiKey, apiEndpoint, modelName, title) {
        if (!apiKey) {
            throw new Error('API key is required for custom provider');
        }
        
        if (!apiEndpoint) {
            throw new Error('API endpoint URL is required for custom provider');
        }
        
        try {
            // Try to use OpenAI-compatible format first
            const response = await axios.post(
                apiEndpoint,
                {
                    model: modelName,
                    messages: [
                        {
                            role: 'system',
                            content: `You are an expert teaching assistant that creates well-structured, comprehensive notes from lecture transcriptions. 
                                     Format the output in markdown with clear headings, bullet points, and formatting. 
                                     Organize the content logically, highlighting key concepts, definitions, examples, and important points.
                                     Include a summary section at the end.`
                        },
                        {
                            role: 'user',
                            content: `Please create comprehensive, well-structured lecture notes from the following transcription. 
                                     Title the notes: "${title}".
                                     \n\n${transcription}`
                        }
                    ],
                    temperature: 0.3,
                    max_tokens: 4000,
                },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${apiKey}`
                    }
                }
            );
            
            // Try to extract the response based on common API structures
            if (response.data.choices && response.data.choices[0].message) {
                return response.data.choices[0].message.content;
            } else if (response.data.content) {
                return response.data.content;
            } else if (response.data.response) {
                return response.data.response;
            } else if (response.data.text) {
                return response.data.text;
            } else {
                console.warn('Unknown API response structure:', response.data);
                return JSON.stringify(response.data);
            }
        } catch (error) {
            console.error('Custom API error:', error.response?.data || error.message);
            throw new Error(`Custom API error: ${error.response?.data?.error?.message || error.message}`);
        }
    }
    
    /**
     * Generate notes using OpenAI API
     * @param {string} transcription - The transcribed text
     * @param {string} model - The model to use
     * @param {string} apiKey - The API key
     * @param {string} title - The title for the notes
     * @returns {Promise<string>} - The generated notes
     */
    async generateWithOpenAI(transcription, model, apiKey, title) {
        if (!apiKey) {
            throw new Error('OpenAI API key is required');
        }
        
        try {
            const response = await axios.post(
                'https://api.openai.com/v1/chat/completions',
                {
                    model,
                    messages: [
                        {
                            role: 'system',
                            content: `You are an expert teaching assistant that creates well-structured, comprehensive notes from lecture transcriptions. 
                                     Format the output in markdown with clear headings, bullet points, and formatting. 
                                     Organize the content logically, highlighting key concepts, definitions, examples, and important points.
                                     Include a summary section at the end.`
                        },
                        {
                            role: 'user',
                            content: `Please create comprehensive, well-structured lecture notes from the following transcription. 
                                     Title the notes: "${title}".
                                     \n\n${transcription}`
                        }
                    ],
                    temperature: 0.3,
                    max_tokens: 4000,
                },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${apiKey}`
                    }
                }
            );
            
            return response.data.choices[0].message.content;
        } catch (error) {
            console.error('OpenAI API error:', error.response?.data || error.message);
            throw new Error(`OpenAI API error: ${error.response?.data?.error?.message || error.message}`);
        }
    }
    
    /**
     * Generate notes using Anthropic API
     * @param {string} transcription - The transcribed text
     * @param {string} model - The model to use
     * @param {string} apiKey - The API key
     * @param {string} title - The title for the notes
     * @returns {Promise<string>} - The generated notes
     */
    async generateWithAnthropic(transcription, model, apiKey, title) {
        if (!apiKey) {
            throw new Error('Anthropic API key is required');
        }
        
        try {
            const response = await axios.post(
                'https://api.anthropic.com/v1/messages',
                {
                    model,
                    max_tokens: 4000,
                    temperature: 0.3,
                    system: `You are an expert teaching assistant that creates well-structured, comprehensive notes from lecture transcriptions. 
                             Format the output in markdown with clear headings, bullet points, and formatting. 
                             Organize the content logically, highlighting key concepts, definitions, examples, and important points.
                             Include a summary section at the end.`,
                    messages: [
                        {
                            role: 'user',
                            content: `Please create comprehensive, well-structured lecture notes from the following transcription. 
                                     Title the notes: "${title}".
                                     \n\n${transcription}`
                        }
                    ]
                },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'x-api-key': apiKey,
                        'anthropic-version': '2023-06-01'
                    }
                }
            );
            
            return response.data.content[0].text;
        } catch (error) {
            console.error('Anthropic API error:', error.response?.data || error.message);
            throw new Error(`Anthropic API error: ${error.response?.data?.error?.message || error.message}`);
        }
    }
    
    /**
     * Generate notes using a local model
     * @param {string} transcription - The transcribed text
     * @param {string} model - The model to use
     * @param {string} title - The title for the notes
     * @returns {Promise<string>} - The generated notes
     */
    async generateWithLocalModel(transcription, model, title) {
        // This is a placeholder for integrating with a local model like LLaMA or Mixtral
        // In a real implementation, you would use a Node.js library to interface with the local model
        
        console.log(`Generating notes with local model: ${model}`);
        
        // For demo purposes, return mock notes
        return this.generateMockNotes(title, transcription);
    }
    
    /**
     * Generate notes using Ollama
     * @param {string} transcription - The transcribed text
     * @param {string} model - The model to use
     * @param {string} title - The title for the notes
     * @returns {Promise<string>} - The generated notes
     */
    async generateWithOllama(transcription, model, title) {
        try {
            const response = await axios.post(
                'http://localhost:11434/api/generate',
                {
                    model,
                    prompt: `You are an expert teaching assistant that creates well-structured, comprehensive notes from lecture transcriptions. 
                            Format the output in markdown with clear headings, bullet points, and formatting. 
                            Organize the content logically, highlighting key concepts, definitions, examples, and important points.
                            Include a summary section at the end.
                            
                            Please create comprehensive, well-structured lecture notes from the following transcription. 
                            Title the notes: "${title}".
                            
                            ${transcription}`,
                    stream: false
                }
            );
            
            return response.data.response;
        } catch (error) {
            console.error('Ollama API error:', error.response?.data || error.message);
            
            // If Ollama is not available, fall back to mock notes
            console.log('Falling back to mock notes');
            return this.generateMockNotes(title, transcription);
        }
    }
    
    /**
     * Generate mock notes for demo purposes
     * @param {string} title - The title for the notes
     * @param {string} transcription - The transcribed text
     * @returns {string} - The generated notes
     */
    generateMockNotes(title, transcription) {
        // Extract some content from the transcription for the mock notes
        const words = transcription.split(' ');
        const excerpt = words.slice(0, 20).join(' ') + '...';
        
        return `# ${title}

## Introduction
- This lecture covers important concepts in the field
- The speaker begins by introducing the topic: "${excerpt}"
- We'll explore key ideas and their applications

## Main Concepts
### First Key Concept
- Detailed explanation of the concept
- Examples and applications
- Connection to previous material

### Second Key Concept
- Analysis of the second concept
- Step-by-step breakdown
- Important formulas and equations

## Case Studies
1. **Real-world Application**: How these concepts apply in practice
   - Results and outcomes
   - Lessons learned

2. **Alternative Approaches**: Different perspectives on the topic
   - Comparative analysis
   - Advantages and limitations

## Summary
- The lecture covered several important concepts
- These ideas form the foundation for future topics
- Key takeaways include understanding the relationship between concepts

## References
1. Referenced works mentioned in the lecture
2. Additional resources for further study

---
*Notes generated by Lectura - AI-powered Lecture Notes Generator*`;
    }
}

module.exports = new NotesGenerationService(); 