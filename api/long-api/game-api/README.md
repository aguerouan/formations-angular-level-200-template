# Game API with AI Data Catalog Agent

This is an Express.js API server that includes:
- Original game data endpoints
- **NEW: AI-powered data catalog exploration**

## Features

### Original Features
- REST API for game data
- Mock data generation for testing

### New AI Data Catalog Features
- 🤖 Natural language queries to explore PostgreSQL schema
- 📊 Automatic schema documentation generation
- 🔍 Search tables, columns, and relationships
- 💬 Claude AI integration for intelligent responses
- 🔗 Foreign key relationship discovery
- 📝 SQL query generation from natural language

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Database

See [Setup Guide](../../../SETUP_GUIDE.md) for detailed instructions.

Quick version:
```bash
# Create PostgreSQL database
psql -U postgres -c "CREATE DATABASE data_catalog;"

# Run setup script
psql -U postgres -d data_catalog -f setup_database.sql
```

### 3. Configure Environment

```bash
# Copy example environment file
cp .env.example .env

# Edit with your credentials
nano .env
```

Required environment variables:
- `ANTHROPIC_API_KEY` - Your Claude API key from https://console.anthropic.com/
- `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` - PostgreSQL connection details

### 4. Start Server

```bash
npm start
```

Server runs on port 3000 by default.

## API Endpoints

### AI Data Catalog Endpoints

#### POST /api/catalog/query
Query the database schema using natural language.

**Request:**
```json
{
  "query": "What tables are in the database?"
}
```

**Response:**
```json
{
  "success": true,
  "query": "What tables are in the database?",
  "response": "The database contains 6 tables: users, products, orders, order_items, categories, and reviews...",
  "model": "claude-3-5-sonnet-20241022",
  "usage": {
    "inputTokens": 450,
    "outputTokens": 120
  }
}
```

#### GET /api/catalog/schema
Get complete database schema or specific table details.

**Query params:**
- `table` (optional) - Get details for a specific table

**Examples:**
```bash
# Get all schema
curl http://localhost:3000/api/catalog/schema

# Get specific table
curl "http://localhost:3000/api/catalog/schema?table=users"
```

#### GET /api/catalog/tables
List all tables in the database.

#### GET /api/catalog/relationships
Get all foreign key relationships.

#### GET /api/catalog/search?q=term
Search for tables or columns matching a term.

#### POST /api/catalog/generate-sql
Generate SQL query from natural language.

**Request:**
```json
{
  "query": "Show all users created in the last week"
}
```

#### GET /api/catalog/health
Check configuration and database connectivity.

### Original Game Endpoints

#### GET /api/games
Get list of games (mock data).

**Query params:**
- `max` (optional) - Maximum number of games to return

## Example Natural Language Queries

Try these queries with `/api/catalog/query`:

**Schema Exploration:**
- "What tables exist in the database?"
- "Describe the users table structure"
- "What columns are in the products table?"
- "Show me all the data types in the orders table"

**Relationships:**
- "How are users and orders related?"
- "What foreign keys exist in the database?"
- "Which tables reference the products table?"

**Metadata:**
- "What is the primary key of each table?"
- "Which columns are nullable in the users table?"
- "What indexes exist on the orders table?"

**SQL Generation:**
- "Write a query to find all users who placed orders"
- "Show me how to get products in the Electronics category"
- "Generate SQL to find orders from the last 30 days"

## Project Structure

```
game-api/
├── app.js                 # Main Express application
├── package.json          # Dependencies
├── .env.example          # Environment template
├── setup_database.sql    # Database setup script
├── bin/
│   └── www               # Server startup script
├── config/
│   └── database.js       # PostgreSQL configuration
├── services/
│   ├── schemaExplorer.js # Database schema utilities
│   └── aiAgent.js        # Claude AI integration
├── routes/
│   ├── index.js          # Home routes
│   ├── users.js          # User routes (original)
│   ├── games.js          # Game routes (original)
│   └── catalog.js        # AI catalog routes (NEW)
├── models/
│   └── game.js           # Game model
├── public/               # Static files
└── views/                # Jade templates
```

## Development

### Testing the AI Agent

```bash
# Check health
curl http://localhost:3000/api/catalog/health

# Test natural language query
curl -X POST http://localhost:3000/api/catalog/query \
  -H "Content-Type: application/json" \
  -d '{"query": "What tables are in the database?"}'

# Get schema
curl http://localhost:3000/api/catalog/schema

# Search for specific term
curl "http://localhost:3000/api/catalog/search?q=user"
```

### Adding New Endpoints

1. Create route handler in `routes/catalog.js`
2. Add schema utilities in `services/schemaExplorer.js` if needed
3. Update AI prompts in `services/aiAgent.js` for better responses

### Debugging

Enable debug logging:
```bash
DEBUG=game-api:* npm start
```

Check logs for:
- Database connection issues
- API key validation errors
- Query processing errors

## Security Notes

⚠️ **Important Security Considerations:**

1. **Never commit `.env` file** - Contains sensitive credentials
2. **Use read-only database user** for catalog exploration
3. **Implement authentication** before deploying to production
4. **Add rate limiting** to prevent abuse
5. **Validate all user inputs** to prevent injection attacks
6. **Monitor API usage** to control costs

### Creating Read-Only Database User

```sql
CREATE USER catalog_reader WITH PASSWORD 'secure_password';
GRANT CONNECT ON DATABASE data_catalog TO catalog_reader;
GRANT USAGE ON SCHEMA public TO catalog_reader;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO catalog_reader;
```

Update `.env` to use this user:
```env
DB_USER=catalog_reader
DB_PASSWORD=secure_password
```

## Cost Estimation

With Claude 3.5 Sonnet pricing:
- ~$0.004 per typical query
- ~$12/month for 100 queries/day
- See [main guide](../../../AI_AGENT_DATA_CATALOG_GUIDE.md) for detailed cost analysis

## Troubleshooting

See [Setup Guide](../../../SETUP_GUIDE.md#troubleshooting) for common issues and solutions.

## Resources

- [Main AI Agent Guide](../../../AI_AGENT_DATA_CATALOG_GUIDE.md) - Comprehensive overview
- [Setup Guide](../../../SETUP_GUIDE.md) - Detailed setup instructions
- [Anthropic API Docs](https://docs.anthropic.com/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)

## License

MIT
