const express = require('express');
const router = express.Router();
const schemaExplorer = require('../services/schemaExplorer');
const aiAgent = require('../services/aiAgent');

/**
 * POST /api/catalog/query
 * Process a natural language query about the database schema
 * 
 * Request body:
 * {
 *   "query": "What tables are in the database?"
 * }
 */
router.post('/query', async (req, res) => {
  try {
    const { query } = req.body;
    
    if (!query || typeof query !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Query is required and must be a string'
      });
    }
    
    // Process the query using AI agent
    const result = await aiAgent.processQuery(query);
    
    res.json(result);
  } catch (error) {
    console.error('Error processing query:', error);
    res.status(500).json({
      success: false,
      error: 'An error occurred while processing your query',
      details: error.message
    });
  }
});

/**
 * POST /api/catalog/query/stream
 * Process a natural language query with streaming response
 * 
 * Request body:
 * {
 *   "query": "What tables are in the database?"
 * }
 */
router.post('/query/stream', async (req, res) => {
  try {
    const { query } = req.body;
    
    if (!query || typeof query !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Query is required and must be a string'
      });
    }
    
    // Set up SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    
    // Process the query with streaming
    await aiAgent.processQueryStream(
      query,
      (chunk) => {
        // Send each chunk as an SSE event
        res.write(`data: ${JSON.stringify({ chunk })}\n\n`);
      }
    );
    
    // Send completion event
    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  } catch (error) {
    console.error('Error processing streaming query:', error);
    res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
    res.end();
  }
});

/**
 * POST /api/catalog/generate-sql
 * Generate SQL query from natural language
 * 
 * Request body:
 * {
 *   "query": "Show all users created in the last 7 days"
 * }
 */
router.post('/generate-sql', async (req, res) => {
  try {
    const { query } = req.body;
    
    if (!query || typeof query !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Query is required and must be a string'
      });
    }
    
    const result = await aiAgent.generateSQL(query);
    res.json(result);
  } catch (error) {
    console.error('Error generating SQL:', error);
    res.status(500).json({
      success: false,
      error: 'An error occurred while generating SQL',
      details: error.message
    });
  }
});

/**
 * GET /api/catalog/schema
 * Get complete database schema overview
 * 
 * Query params (optional):
 * - table: Get details for a specific table
 */
router.get('/schema', async (req, res) => {
  try {
    const { table } = req.query;
    
    if (table) {
      // Get details for a specific table
      const details = await schemaExplorer.getTableDetails(table);
      res.json({
        success: true,
        data: details
      });
    } else {
      // Get complete schema overview
      const schema = await schemaExplorer.getSchemaOverview();
      res.json({
        success: true,
        data: schema
      });
    }
  } catch (error) {
    console.error('Error fetching schema:', error);
    res.status(500).json({
      success: false,
      error: 'An error occurred while fetching schema information',
      details: error.message
    });
  }
});

/**
 * GET /api/catalog/tables
 * Get list of all tables in the database
 */
router.get('/tables', async (req, res) => {
  try {
    const tables = await schemaExplorer.getAllTables();
    res.json({
      success: true,
      data: tables
    });
  } catch (error) {
    console.error('Error fetching tables:', error);
    res.status(500).json({
      success: false,
      error: 'An error occurred while fetching tables',
      details: error.message
    });
  }
});

/**
 * GET /api/catalog/relationships
 * Get all relationships (foreign keys) in the database
 */
router.get('/relationships', async (req, res) => {
  try {
    const relationships = await schemaExplorer.getAllRelationships();
    res.json({
      success: true,
      data: relationships
    });
  } catch (error) {
    console.error('Error fetching relationships:', error);
    res.status(500).json({
      success: false,
      error: 'An error occurred while fetching relationships',
      details: error.message
    });
  }
});

/**
 * GET /api/catalog/search
 * Search for tables or columns matching a pattern
 * 
 * Query params:
 * - q: Search term
 */
router.get('/search', async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q || typeof q !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Search term (q) is required'
      });
    }
    
    const results = await schemaExplorer.searchSchema(q);
    res.json({
      success: true,
      data: results
    });
  } catch (error) {
    console.error('Error searching schema:', error);
    res.status(500).json({
      success: false,
      error: 'An error occurred while searching',
      details: error.message
    });
  }
});

/**
 * GET /api/catalog/health
 * Check AI agent configuration and database connectivity
 */
router.get('/health', async (req, res) => {
  try {
    const config = aiAgent.checkConfiguration();
    
    // Try to connect to database
    let dbConnected = false;
    try {
      await schemaExplorer.getAllTables();
      dbConnected = true;
    } catch (dbError) {
      console.error('Database connection error:', dbError);
    }
    
    res.json({
      success: true,
      configuration: config,
      database: {
        connected: dbConnected,
        message: dbConnected ? 'Database connection successful' : 'Database connection failed'
      }
    });
  } catch (error) {
    console.error('Error checking health:', error);
    res.status(500).json({
      success: false,
      error: 'An error occurred while checking health',
      details: error.message
    });
  }
});

module.exports = router;
