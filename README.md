# formations-angular-level-200-template
Template of the project to work on training course level 200

## 🆕 New Feature: AI Agent for Data Catalog Exploration

This project now includes an AI-powered agent that lets you explore PostgreSQL database schemas using natural language! 

### Quick Links

- **[📘 Complete Guide](./AI_AGENT_DATA_CATALOG_GUIDE.md)** - Comprehensive overview of the AI agent approach
- **[🚀 Setup Guide](./SETUP_GUIDE.md)** - Step-by-step setup instructions
- **[💻 API Documentation](./api/long-api/game-api/README.md)** - API endpoints and usage

### What Can You Do?

Ask questions in plain English:
- "What tables are in the database?"
- "Show me the structure of the users table"
- "How are products and orders related?"
- "Generate SQL to find users created this week"

### Why This Approach?

The guide compares **three approaches** for building an AI data catalog agent:
1. **Claude Desktop with MCP** - Good for desktop use
2. **n8n Workflow** - Good for complex automations
3. **Simple API Integration** ⭐ - **Recommended** for simplicity

We implemented the **Simple API Integration** approach as it's the easiest to set up and integrate with web applications.

### Quick Start

```bash
# 1. Install dependencies
cd api/long-api/game-api
npm install

# 2. Set up PostgreSQL database
psql -U postgres -c "CREATE DATABASE data_catalog;"
psql -U postgres -d data_catalog -f setup_database.sql

# 3. Configure environment
cp .env.example .env
# Edit .env with your Anthropic API key and DB credentials

# 4. Start the server
npm start

# 5. Test it!
curl -X POST http://localhost:3000/api/catalog/query \
  -H "Content-Type: application/json" \
  -d '{"query": "What tables are in the database?"}'
```

For complete setup instructions, see the [Setup Guide](./SETUP_GUIDE.md).

---

## Original Project

Star Wars Game - Angular training application
