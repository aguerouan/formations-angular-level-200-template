# AI Agent Data Catalog - Usage Examples

This document provides practical examples of using the AI Agent to explore your PostgreSQL data catalog.

## Prerequisites

Before running these examples:
1. Complete the setup in [SETUP_GUIDE.md](./SETUP_GUIDE.md)
2. Ensure the API server is running: `npm start`
3. Have PostgreSQL database set up with sample data

## Basic Examples

### 1. Check System Health

First, verify everything is configured correctly:

```bash
curl http://localhost:3000/api/catalog/health
```

**Expected Response:**
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

### 2. Ask About Available Tables

```bash
curl -X POST http://localhost:3000/api/catalog/query \
  -H "Content-Type: application/json" \
  -d '{
    "query": "What tables are in the database?"
  }'
```

**Sample Response:**
```json
{
  "success": true,
  "query": "What tables are in the database?",
  "response": "The database contains 6 tables:\n\n1. **users** - Stores user account information\n2. **products** - Contains product catalog data\n3. **orders** - Tracks customer orders\n4. **order_items** - Line items for each order\n5. **categories** - Product categories\n6. **reviews** - Product reviews from users",
  "model": "claude-3-5-sonnet-20241022",
  "usage": {
    "inputTokens": 542,
    "outputTokens": 98
  }
}
```

### 3. Explore a Specific Table

```bash
curl -X POST http://localhost:3000/api/catalog/query \
  -H "Content-Type: application/json" \
  -d '{
    "query": "Describe the structure of the users table"
  }'
```

**Sample Response:**
```json
{
  "success": true,
  "query": "Describe the structure of the users table",
  "response": "The **users** table has the following structure:\n\n**Columns:**\n- `id` (SERIAL) - Primary key, auto-incrementing\n- `username` (VARCHAR(100)) - NOT NULL, unique username\n- `email` (VARCHAR(255)) - NOT NULL, unique email address\n- `first_name` (VARCHAR(100)) - User's first name\n- `last_name` (VARCHAR(100)) - User's last name\n- `created_at` (TIMESTAMP) - Account creation timestamp, defaults to current time\n- `updated_at` (TIMESTAMP) - Last update timestamp, defaults to current time\n\n**Constraints:**\n- Primary Key: `id`\n- Unique constraints on `username` and `email`",
  "model": "claude-3-5-sonnet-20241022",
  "usage": {
    "inputTokens": 568,
    "outputTokens": 156
  }
}
```

### 4. Understanding Relationships

```bash
curl -X POST http://localhost:3000/api/catalog/query \
  -H "Content-Type: application/json" \
  -d '{
    "query": "How are users and orders connected?"
  }'
```

### 5. Generate SQL Queries

```bash
curl -X POST http://localhost:3000/api/catalog/generate-sql \
  -H "Content-Type: application/json" \
  -d '{
    "query": "Show all users who have placed orders"
  }'
```

**Sample Response:**
```json
{
  "success": true,
  "sql": "SELECT DISTINCT u.id, u.username, u.email, u.first_name, u.last_name\nFROM users u\nINNER JOIN orders o ON u.id = o.user_id;",
  "explanation": "This query retrieves all unique users who have placed at least one order by joining the users table with the orders table on the user_id foreign key.",
  "warnings": [],
  "usage": {
    "inputTokens": 605,
    "outputTokens": 89
  }
}
```

## Advanced Examples

### 6. Get Raw Schema Data

If you need structured schema data instead of natural language:

```bash
# Get complete schema
curl http://localhost:3000/api/catalog/schema

# Get specific table details
curl "http://localhost:3000/api/catalog/schema?table=products"
```

### 7. List All Tables (Structured)

```bash
curl http://localhost:3000/api/catalog/tables
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "table_name": "users",
      "table_type": "BASE TABLE",
      "size": "16 kB"
    },
    {
      "table_name": "products",
      "table_type": "BASE TABLE",
      "size": "24 kB"
    }
  ]
}
```

### 8. View Relationships

```bash
curl http://localhost:3000/api/catalog/relationships
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "table_name": "orders",
      "column_name": "user_id",
      "foreign_table_name": "users",
      "foreign_column_name": "id",
      "constraint_name": "orders_user_id_fkey"
    },
    {
      "table_name": "order_items",
      "column_name": "order_id",
      "foreign_table_name": "orders",
      "foreign_column_name": "id",
      "constraint_name": "order_items_order_id_fkey"
    }
  ]
}
```

### 9. Search for Specific Terms

```bash
curl "http://localhost:3000/api/catalog/search?q=email"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "matchingTables": [],
    "matchingColumns": [
      {
        "table_name": "users",
        "column_name": "email",
        "data_type": "character varying"
      }
    ]
  }
}
```

### 10. Complex Natural Language Queries

**Question about data types:**
```bash
curl -X POST http://localhost:3000/api/catalog/query \
  -H "Content-Type: application/json" \
  -d '{
    "query": "Which tables use DECIMAL data type and what are they for?"
  }'
```

**Question about constraints:**
```bash
curl -X POST http://localhost:3000/api/catalog/query \
  -H "Content-Type: application/json" \
  -d '{
    "query": "What validation constraints exist in the database?"
  }'
```

**Question about indexes:**
```bash
curl -X POST http://localhost:3000/api/catalog/query \
  -H "Content-Type: application/json" \
  -d '{
    "query": "What indexes are defined in the database and why?"
  }'
```

## Using with cURL Scripts

### Save responses to file

```bash
curl -X POST http://localhost:3000/api/catalog/query \
  -H "Content-Type: application/json" \
  -d '{"query": "Document all tables and their relationships"}' \
  -o schema_documentation.json
```

### Pretty print JSON responses

```bash
curl -X POST http://localhost:3000/api/catalog/query \
  -H "Content-Type: application/json" \
  -d '{"query": "What tables are in the database?"}' \
  | jq '.'
```

### Extract just the response text

```bash
curl -s -X POST http://localhost:3000/api/catalog/query \
  -H "Content-Type: application/json" \
  -d '{"query": "What tables are in the database?"}' \
  | jq -r '.response'
```

## Using with Python

```python
import requests
import json

API_URL = "http://localhost:3000/api/catalog"

def query_catalog(question):
    """Ask a natural language question about the database schema"""
    response = requests.post(
        f"{API_URL}/query",
        json={"query": question},
        headers={"Content-Type": "application/json"}
    )
    return response.json()

def get_schema(table_name=None):
    """Get schema information"""
    params = {"table": table_name} if table_name else {}
    response = requests.get(f"{API_URL}/schema", params=params)
    return response.json()

# Example usage
if __name__ == "__main__":
    # Ask a question
    result = query_catalog("What tables are in the database?")
    print(result["response"])
    
    # Get structured schema data
    schema = get_schema()
    print(f"Total tables: {schema['data']['totalTables']}")
    
    # Get specific table details
    users_table = get_schema("users")
    print(json.dumps(users_table, indent=2))
```

## Using with JavaScript/Node.js

```javascript
const axios = require('axios');

const API_URL = 'http://localhost:3000/api/catalog';

async function queryCatalog(question) {
  const response = await axios.post(`${API_URL}/query`, {
    query: question
  });
  return response.data;
}

async function getSchema(tableName = null) {
  const params = tableName ? { table: tableName } : {};
  const response = await axios.get(`${API_URL}/schema`, { params });
  return response.data;
}

async function generateSQL(query) {
  const response = await axios.post(`${API_URL}/generate-sql`, {
    query: query
  });
  return response.data;
}

// Example usage
(async () => {
  // Ask a question
  const result = await queryCatalog('What tables are in the database?');
  console.log(result.response);
  
  // Generate SQL
  const sql = await generateSQL('Show all active products');
  console.log('Generated SQL:', sql.sql);
  console.log('Explanation:', sql.explanation);
  
  // Get schema
  const schema = await getSchema();
  console.log(`Total tables: ${schema.data.totalTables}`);
})();
```

## Integration with Frontend

### Example Angular Service

```typescript
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

interface QueryResponse {
  success: boolean;
  query: string;
  response: string;
  model: string;
  usage: {
    inputTokens: number;
    outputTokens: number;
  };
}

@Injectable({
  providedIn: 'root'
})
export class CatalogService {
  private apiUrl = 'http://localhost:3000/api/catalog';

  constructor(private http: HttpClient) {}

  querySchema(question: string): Observable<QueryResponse> {
    return this.http.post<QueryResponse>(`${this.apiUrl}/query`, {
      query: question
    });
  }

  getSchema(tableName?: string): Observable<any> {
    const params = tableName ? { table: tableName } : {};
    return this.http.get(`${this.apiUrl}/schema`, { params });
  }

  generateSQL(query: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/generate-sql`, { query });
  }

  checkHealth(): Observable<any> {
    return this.http.get(`${this.apiUrl}/health`);
  }
}
```

## Error Handling

### API Key Issues

```json
{
  "success": false,
  "error": "Invalid API key. Please check your ANTHROPIC_API_KEY configuration.",
  "query": "What tables are in the database?"
}
```

### Database Connection Issues

```json
{
  "success": false,
  "error": "An error occurred while fetching schema information",
  "details": "connect ECONNREFUSED 127.0.0.1:5432"
}
```

### Invalid Request

```json
{
  "success": false,
  "error": "Query is required and must be a string"
}
```

## Performance Tips

1. **Cache schema information** - The schema doesn't change often
2. **Use structured endpoints** when you don't need AI interpretation
3. **Batch similar queries** to reduce API calls
4. **Monitor token usage** to control costs

## Next Steps

- Integrate the API with your Angular frontend
- Add authentication to protect endpoints
- Implement caching for frequently accessed schema information
- Create a chat-like interface for interactive exploration
- Add query history and favorites

## Resources

- [Main Guide](../../AI_AGENT_DATA_CATALOG_GUIDE.md)
- [Setup Instructions](../../SETUP_GUIDE.md)
- [API Documentation](./README.md)
