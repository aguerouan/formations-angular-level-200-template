require('dotenv').config();
const Anthropic = require('@anthropic-ai/sdk');
const schemaExplorer = require('./schemaExplorer');

/**
 * AI Agent Service
 * 
 * Integrates with Claude API to provide natural language querying
 * capabilities for the database schema.
 */

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

/**
 * Process a natural language query about the database schema
 * @param {string} userQuery - User's natural language question
 * @param {Object} options - Additional options (model, maxTokens, etc.)
 * @returns {Promise<Object>} AI response with answer
 */
async function processQuery(userQuery, options = {}) {
  try {
    // Get the current database schema
    const schema = await schemaExplorer.getSchemaOverview();
    const schemaContext = schemaExplorer.formatSchemaForAI(schema);
    
    // Prepare the system prompt
    const systemPrompt = `You are a helpful database assistant that helps users understand their PostgreSQL database schema. 

You have access to the following database schema information:

${schemaContext}

When answering questions:
1. Be concise and clear
2. Reference specific table and column names from the schema
3. Explain relationships between tables when relevant
4. If the user asks about something not in the schema, politely let them know
5. Format responses in a readable way (use bullet points, tables when appropriate)
6. If asked to generate SQL, provide PostgreSQL-compatible queries

Always base your answers on the schema information provided above.`;

    // Call Claude API
    const message = await anthropic.messages.create({
      model: options.model || 'claude-3-5-sonnet-20241022',
      max_tokens: options.maxTokens || 1024,
      messages: [
        {
          role: 'user',
          content: userQuery
        }
      ],
      system: systemPrompt
    });
    
    // Extract the response text
    const responseText = message.content[0].text;
    
    return {
      success: true,
      query: userQuery,
      response: responseText,
      model: message.model,
      usage: {
        inputTokens: message.usage.input_tokens,
        outputTokens: message.usage.output_tokens
      }
    };
  } catch (error) {
    console.error('Error processing query:', error);
    
    // Handle specific error cases
    if (error.status === 401) {
      return {
        success: false,
        error: 'Invalid API key. Please check your ANTHROPIC_API_KEY configuration.',
        query: userQuery
      };
    }
    
    if (error.status === 429) {
      return {
        success: false,
        error: 'Rate limit exceeded. Please try again later.',
        query: userQuery
      };
    }
    
    return {
      success: false,
      error: error.message || 'An error occurred while processing your query',
      query: userQuery
    };
  }
}

/**
 * Process a query with streaming response
 * @param {string} userQuery - User's natural language question
 * @param {Function} onChunk - Callback function for each chunk of response
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} Final response with metadata
 */
async function processQueryStream(userQuery, onChunk, options = {}) {
  try {
    // Get the current database schema
    const schema = await schemaExplorer.getSchemaOverview();
    const schemaContext = schemaExplorer.formatSchemaForAI(schema);
    
    // Prepare the system prompt
    const systemPrompt = `You are a helpful database assistant that helps users understand their PostgreSQL database schema. 

You have access to the following database schema information:

${schemaContext}

When answering questions:
1. Be concise and clear
2. Reference specific table and column names from the schema
3. Explain relationships between tables when relevant
4. If the user asks about something not in the schema, politely let them know
5. Format responses in a readable way (use bullet points, tables when appropriate)
6. If asked to generate SQL, provide PostgreSQL-compatible queries

Always base your answers on the schema information provided above.`;

    // Call Claude API with streaming
    const stream = await anthropic.messages.create({
      model: options.model || 'claude-3-5-sonnet-20241022',
      max_tokens: options.maxTokens || 1024,
      messages: [
        {
          role: 'user',
          content: userQuery
        }
      ],
      system: systemPrompt,
      stream: true
    });
    
    let fullResponse = '';
    let usage = null;
    
    // Process the stream
    for await (const chunk of stream) {
      if (chunk.type === 'content_block_delta') {
        const text = chunk.delta.text;
        fullResponse += text;
        if (onChunk) {
          onChunk(text);
        }
      } else if (chunk.type === 'message_delta' && chunk.usage) {
        usage = chunk.usage;
      }
    }
    
    return {
      success: true,
      query: userQuery,
      response: fullResponse,
      usage
    };
  } catch (error) {
    console.error('Error processing streaming query:', error);
    throw error;
  }
}

/**
 * Generate SQL query from natural language
 * @param {string} naturalLanguageQuery - Natural language description of desired query
 * @returns {Promise<Object>} Generated SQL query and explanation
 */
async function generateSQL(naturalLanguageQuery) {
  try {
    // Get the current database schema
    const schema = await schemaExplorer.getSchemaOverview();
    const schemaContext = schemaExplorer.formatSchemaForAI(schema);
    
    const systemPrompt = `You are a PostgreSQL expert that generates SQL queries based on natural language descriptions.

Database Schema:
${schemaContext}

Generate PostgreSQL-compatible SQL queries based on the user's request. 

Respond in the following JSON format:
{
  "sql": "SELECT ... FROM ... WHERE ...",
  "explanation": "Brief explanation of what the query does",
  "warnings": ["Any warnings about the query if applicable"]
}

Only generate queries that are safe to execute (no DROP, DELETE, UPDATE unless explicitly requested).`;

    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: `Generate a SQL query for: ${naturalLanguageQuery}

IMPORTANT: Respond with ONLY valid JSON in this exact format, no markdown formatting:
{"sql": "SELECT ...", "explanation": "...", "warnings": []}`
        }
      ],
      system: systemPrompt
    });
    
    const responseText = message.content[0].text;
    
    // Try to parse JSON response
    try {
      // First try direct parsing
      let parsed;
      try {
        parsed = JSON.parse(responseText);
      } catch (directParseError) {
        // If that fails, try to extract from markdown code blocks
        const jsonMatch = responseText.match(/```json\n([\s\S]*?)\n```/) || 
                         responseText.match(/```\n([\s\S]*?)\n```/) ||
                         responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const jsonText = jsonMatch[1] || jsonMatch[0];
          parsed = JSON.parse(jsonText);
        } else {
          throw new Error('Could not extract JSON from response');
        }
      }
      
      return {
        success: true,
        ...parsed,
        usage: {
          inputTokens: message.usage.input_tokens,
          outputTokens: message.usage.output_tokens
        }
      };
    } catch (parseError) {
      // If parsing fails, return the raw response
      console.warn('Failed to parse JSON from Claude response:', parseError);
      return {
        success: true,
        sql: null,
        explanation: responseText,
        warning: 'Response was not in expected JSON format',
        usage: {
          inputTokens: message.usage.input_tokens,
          outputTokens: message.usage.output_tokens
        }
      };
    }
  } catch (error) {
    console.error('Error generating SQL:', error);
    return {
      success: false,
      error: error.message || 'An error occurred while generating SQL'
    };
  }
}

/**
 * Check if the AI agent is properly configured
 * @returns {Object} Configuration status
 */
function checkConfiguration() {
  const hasApiKey = !!process.env.ANTHROPIC_API_KEY;
  const hasDbConfig = !!(process.env.DB_HOST || process.env.DB_NAME);
  
  return {
    configured: hasApiKey && hasDbConfig,
    apiKeySet: hasApiKey,
    databaseConfigured: hasDbConfig,
    message: hasApiKey && hasDbConfig 
      ? 'AI Agent is properly configured' 
      : 'Missing configuration. Please set ANTHROPIC_API_KEY and database credentials.'
  };
}

module.exports = {
  processQuery,
  processQueryStream,
  generateSQL,
  checkConfiguration
};
