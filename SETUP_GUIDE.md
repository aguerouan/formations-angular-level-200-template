# AI Agent Data Catalog - Setup Guide

## Quick Start

This guide will help you set up the AI Agent to explore your PostgreSQL data catalog with natural language queries.

## Prerequisites

- Node.js (v14 or higher)
- PostgreSQL (v12 or higher)
- Anthropic API key (get one at https://console.anthropic.com/)

## Installation Steps

### 1. Install Dependencies

```bash
cd api/long-api/game-api
npm install
```

### 2. Set Up PostgreSQL Database

#### Create Database

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE data_catalog;

# Connect to the new database
\c data_catalog
```

#### Create Sample Tables

```sql
-- Create users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create products table
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2),
    category VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create orders table
CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    total DECIMAL(10, 2),
    status VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add some sample data (optional)
INSERT INTO users (username, email) VALUES 
    ('john_doe', 'john@example.com'),
    ('jane_smith', 'jane@example.com');

INSERT INTO products (name, description, price, category) VALUES 
    ('Laptop', 'High-performance laptop', 999.99, 'Electronics'),
    ('Mouse', 'Wireless mouse', 29.99, 'Electronics');

INSERT INTO orders (user_id, total, status) VALUES 
    (1, 999.99, 'completed'),
    (2, 29.99, 'pending');
```

### 3. Configure Environment Variables

```bash
# Copy the example environment file
cp .env.example .env

# Edit .env file with your credentials
nano .env
```

Update the following values in `.env`:

```env
# PostgreSQL Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=data_catalog
DB_USER=postgres
DB_PASSWORD=your_actual_password

# Anthropic API Key
ANTHROPIC_API_KEY=sk-ant-api03-your-actual-api-key
```

### 4. Test the Setup

```bash
# Start the API server
npm start
```

The server should start on port 3000 (or as configured in `bin/www`).

### 5. Test the Endpoints

#### Check Health

```bash
curl http://localhost:3000/api/catalog/health
```

Expected response:
```json
{
  "success": true,
  "configuration": {
    "configured": true,
    "apiKeySet": true,
    "databaseConfigured": true,
    "message": "AI Agent is properly configured"
  },
  "database": {
    "connected": true,
    "message": "Database connection successful"
  }
}
```

#### Query the Database Schema

```bash
curl -X POST http://localhost:3000/api/catalog/query \
  -H "Content-Type: application/json" \
  -d '{"query": "What tables are in the database?"}'
```

Expected response:
```json
{
  "success": true,
  "query": "What tables are in the database?",
  "response": "The database contains 3 tables:\n\n1. **users** - Stores user information...",
  "model": "claude-3-5-sonnet-20241022",
  "usage": {
    "inputTokens": 450,
    "outputTokens": 120
  }
}
```

## API Endpoints

### Natural Language Query

**POST /api/catalog/query**

Query the database schema using natural language.

```bash
curl -X POST http://localhost:3000/api/catalog/query \
  -H "Content-Type: application/json" \
  -d '{"query": "Show me the structure of the users table"}'
```

### Get Schema Overview

**GET /api/catalog/schema**

Get the complete database schema.

```bash
curl http://localhost:3000/api/catalog/schema
```

### Get Specific Table Details

**GET /api/catalog/schema?table=users**

Get details for a specific table.

```bash
curl "http://localhost:3000/api/catalog/schema?table=users"
```

### List All Tables

**GET /api/catalog/tables**

Get a list of all tables.

```bash
curl http://localhost:3000/api/catalog/tables
```

### Get Relationships

**GET /api/catalog/relationships**

Get all foreign key relationships.

```bash
curl http://localhost:3000/api/catalog/relationships
```

### Search Schema

**GET /api/catalog/search?q=user**

Search for tables or columns matching a pattern.

```bash
curl "http://localhost:3000/api/catalog/search?q=user"
```

### Generate SQL

**POST /api/catalog/generate-sql**

Generate SQL queries from natural language.

```bash
curl -X POST http://localhost:3000/api/catalog/generate-sql \
  -H "Content-Type: application/json" \
  -d '{"query": "Show all users created in the last 7 days"}'
```

## Example Natural Language Queries

Try these queries with the `/api/catalog/query` endpoint:

1. **Schema exploration:**
   - "What tables are in the database?"
   - "Describe the structure of the products table"
   - "What columns does the orders table have?"

2. **Relationships:**
   - "How are the users and orders tables related?"
   - "What foreign keys exist in the database?"
   - "Show me all relationships between tables"

3. **Data types:**
   - "What data types are used in the users table?"
   - "Which columns are required (NOT NULL) in the products table?"

4. **Metadata:**
   - "What is the primary key of the orders table?"
   - "Which tables have timestamps?"

## Troubleshooting

### "Database connection failed"

**Problem:** Cannot connect to PostgreSQL database.

**Solutions:**
1. Verify PostgreSQL is running: `systemctl status postgresql` (Linux) or check services (Windows)
2. Check connection credentials in `.env`
3. Ensure the database exists: `psql -U postgres -l`
4. Check firewall settings if connecting to remote database

### "Invalid API key"

**Problem:** Anthropic API key is not valid.

**Solutions:**
1. Verify API key is correctly copied from https://console.anthropic.com/
2. Ensure there are no extra spaces in the `.env` file
3. Check that the API key hasn't expired
4. Verify your Anthropic account has credit

### "Module not found"

**Problem:** Required packages are not installed.

**Solution:**
```bash
cd api/long-api/game-api
npm install
```

### Server won't start

**Problem:** Port 3000 is already in use.

**Solution:**
```bash
# Find process using port 3000
lsof -i :3000  # Linux/Mac
netstat -ano | findstr :3000  # Windows

# Kill the process or change port in bin/www
```

## Security Best Practices

1. **Never commit `.env` file** - It's already in `.gitignore`
2. **Use read-only database user** for catalog exploration:
   ```sql
   CREATE USER catalog_reader WITH PASSWORD 'secure_password';
   GRANT CONNECT ON DATABASE data_catalog TO catalog_reader;
   GRANT USAGE ON SCHEMA public TO catalog_reader;
   GRANT SELECT ON ALL TABLES IN SCHEMA public TO catalog_reader;
   ```
3. **Implement rate limiting** for production use
4. **Add authentication** to protect API endpoints
5. **Monitor API usage** to control costs

## Cost Management

### Estimated Costs

With Claude 3.5 Sonnet pricing (~$0.003/1K input tokens, ~$0.015/1K output tokens):

- **Typical query:** ~500 input tokens + ~150 output tokens = ~$0.004 per query
- **100 queries/day:** ~$0.40/day = ~$12/month
- **1000 queries/day:** ~$4/day = ~$120/month

### Tips to Reduce Costs

1. **Cache schema information** - The database schema doesn't change often
2. **Use smaller models** for simple queries (Claude 3 Haiku)
3. **Implement query history** to avoid duplicate questions
4. **Set token limits** appropriately
5. **Monitor usage** through Anthropic console

## Next Steps

1. **Integrate with Frontend:** Create a UI in the Angular app to interact with the API
2. **Add Caching:** Implement Redis to cache schema information
3. **Add Authentication:** Protect endpoints with JWT or session-based auth
4. **Add Query History:** Store previous queries and responses
5. **Add SQL Execution:** Allow executing generated SQL queries (with proper safety checks)
6. **Add Multi-Database Support:** Connect to multiple databases
7. **Add Visualizations:** Generate ER diagrams or table relationship graphs

## Resources

- [Main Guide](./AI_AGENT_DATA_CATALOG_GUIDE.md) - Comprehensive overview
- [Anthropic API Docs](https://docs.anthropic.com/)
- [PostgreSQL Docs](https://www.postgresql.org/docs/)
- [Node.js pg Library](https://node-postgres.com/)

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review the main guide document
3. Check API logs for detailed error messages
4. Verify all environment variables are set correctly
