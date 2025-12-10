# Building an AI Agent to Explore Your Data Catalog with Natural Language

## Overview

This guide explains how to build an AI agent that allows you to explore a PostgreSQL data catalog using natural language queries. Instead of writing SQL, you can ask questions like "Show me all tables" or "What columns are in the users table?" and get intelligent responses.

## Approach Comparison: n8n vs Claude Desktop vs Simple API Integration

### Option 1: Claude Desktop with MCP (Model Context Protocol)
**Complexity:** Medium  
**Best For:** Personal use, desktop applications

**Pros:**
- Direct integration with Claude Desktop
- Works offline once configured
- Good for local development
- MCP provides standardized protocol

**Cons:**
- Requires Claude Desktop installation
- Limited to desktop environment
- More setup complexity

### Option 2: n8n Workflow Automation
**Complexity:** Medium-High  
**Best For:** Complex workflows, multiple integrations

**Pros:**
- Visual workflow builder
- Can integrate multiple services
- Good for complex automation
- Self-hosted option available

**Cons:**
- Requires separate n8n server
- Overkill for simple queries
- Additional infrastructure to maintain
- Learning curve for workflow design

### Option 3: Simple API Integration (Recommended) ⭐
**Complexity:** Low  
**Best For:** Web applications, simple integrations

**Pros:**
- **Simplest to implement**
- Works in any environment
- Easy to integrate with existing apps
- Direct API control
- No additional infrastructure
- Can be deployed anywhere

**Cons:**
- Requires API key management
- API costs (but minimal for small usage)

## Recommended Solution: Simple API Integration

We'll implement a simple REST API endpoint that:
1. Accepts natural language queries
2. Connects to PostgreSQL to get schema information
3. Uses Claude API to interpret the query
4. Returns formatted results

## Architecture

```
User → Express API → Claude API → PostgreSQL Schema → Response
                  ↓
            Schema Context
```

## Implementation

### 1. PostgreSQL Setup

First, set up a PostgreSQL database with a sample data catalog:

```sql
-- Create sample tables
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2),
    category VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    total DECIMAL(10, 2),
    status VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 2. Dependencies

Install required packages:

```bash
cd api/long-api/game-api
npm install pg @anthropic-ai/sdk dotenv
```

### 3. Configuration

Create a `.env` file in `api/long-api/game-api/`:

```env
# PostgreSQL Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=data_catalog
DB_USER=postgres
DB_PASSWORD=your_password

# Claude API Configuration
ANTHROPIC_API_KEY=your_anthropic_api_key_here
```

### 4. Implementation Files

The implementation includes:

- `config/database.js` - PostgreSQL connection configuration
- `services/schemaExplorer.js` - Utilities to explore database schema
- `services/aiAgent.js` - Claude API integration for natural language processing
- `routes/catalog.js` - REST API endpoints

### 5. API Endpoints

**POST /api/catalog/query**
```json
{
  "query": "What tables are in the database?"
}
```

**GET /api/catalog/schema**
```json
{
  "table": "users"
}
```

## Example Natural Language Queries

Once implemented, you can ask questions like:

1. **Schema Exploration:**
   - "Show me all tables in the database"
   - "What columns are in the users table?"
   - "Describe the products table structure"

2. **Relationships:**
   - "What tables have foreign keys?"
   - "How are users and orders related?"

3. **Data Types:**
   - "What data types are used in the orders table?"
   - "Which tables have timestamp columns?"

4. **Metadata:**
   - "When was the users table created?"
   - "What's the primary key of the products table?"

## How It Works

1. **User Input:** You send a natural language query to the API
2. **Schema Context:** The API retrieves the current database schema
3. **AI Processing:** Claude API receives your query + schema context
4. **Response Generation:** Claude interprets the query and generates a human-readable response
5. **Result:** You get an answer in natural language

## Security Considerations

1. **API Key Protection:**
   - Never commit API keys to source control
   - Use environment variables
   - Consider using secret management services

2. **Database Access:**
   - Use read-only database users for catalog exploration
   - Implement proper authentication for the API
   - Rate limit API requests

3. **Input Validation:**
   - Sanitize all user inputs
   - Implement query timeouts
   - Limit response sizes

## Cost Considerations

- **Claude API:** Pay per token (~$0.002-0.024 per 1K tokens depending on model)
- **PostgreSQL:** Free (self-hosted) or cloud hosting costs
- **Infrastructure:** Minimal for simple API

For typical usage (100 queries/day), expect costs under $5/month.

## Extending the Solution

### Add Query Generation

Extend the AI agent to not just describe schema but also generate SQL queries:

```javascript
// Example: "Show me all users created this week"
// → Generates: SELECT * FROM users WHERE created_at >= NOW() - INTERVAL '7 days'
```

### Add Multiple Database Support

Support multiple PostgreSQL databases or other database types:

```javascript
const dbConnections = {
  production: pgClient1,
  analytics: pgClient2,
  staging: pgClient3
};
```

### Add Caching

Cache schema information to reduce database queries:

```javascript
const schemaCache = new NodeCache({ stdTTL: 3600 }); // 1 hour cache
```

### Add UI Integration

Create a chat interface in the Angular frontend:

```typescript
// Component to send natural language queries
export class CatalogExplorerComponent {
  queryDatabase(query: string) {
    return this.http.post('/api/catalog/query', { query });
  }
}
```

## Troubleshooting

### Common Issues

1. **"Connection refused" errors**
   - Check PostgreSQL is running
   - Verify connection credentials
   - Ensure firewall allows connection

2. **"Invalid API key" errors**
   - Verify ANTHROPIC_API_KEY is set correctly
   - Check API key has not expired
   - Ensure key has proper permissions

3. **Slow responses**
   - Implement caching for schema data
   - Use streaming responses for large results
   - Consider connection pooling

## Conclusion

The simple API integration approach is the most straightforward way to build an AI agent for data catalog exploration. It requires minimal infrastructure, integrates easily with existing applications, and provides powerful natural language querying capabilities.

For production use, consider adding:
- Authentication and authorization
- Rate limiting
- Audit logging
- Error handling and monitoring
- Response caching
- Query history

## Resources

- [Anthropic Claude API Documentation](https://docs.anthropic.com/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Node.js pg Library](https://node-postgres.com/)
