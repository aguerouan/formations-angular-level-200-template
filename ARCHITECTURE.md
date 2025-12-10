# AI Agent Data Catalog - Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         USER INTERFACES                              │
├─────────────────────────────────────────────────────────────────────┤
│  cURL  │  Python  │  JavaScript  │  Angular  │  React  │  Any HTTP  │
└───┬────┴────┬─────┴──────┬───────┴─────┬─────┴────┬────┴─────┬──────┘
    │         │            │             │          │          │
    └─────────┴────────────┴─────────────┴──────────┴──────────┘
                                  │
                                  ▼
         ┌────────────────────────────────────────────────┐
         │          Express.js REST API                   │
         │         (Port 3000 by default)                 │
         └────────────────────────────────────────────────┘
                                  │
         ┌────────────────────────┴───────────────────────┐
         │                                                 │
         ▼                                                 ▼
┌─────────────────────┐                         ┌──────────────────┐
│  Catalog Routes     │                         │  Original Routes │
│  /api/catalog/*     │                         │  /api/games      │
└──────────┬──────────┘                         └──────────────────┘
           │
           ├──────────────────────────────────────┐
           │                                      │
           ▼                                      ▼
  ┌─────────────────┐                  ┌──────────────────┐
  │  AI Agent       │                  │  Schema Explorer │
  │  Service        │◄─────────────────┤  Service         │
  └────────┬────────┘   Schema Info    └────────┬─────────┘
           │                                     │
           │                                     │
           ▼                                     ▼
  ┌─────────────────┐                  ┌──────────────────┐
  │  Claude API     │                  │  PostgreSQL      │
  │  (Anthropic)    │                  │  Database        │
  └─────────────────┘                  └──────────────────┘
   - Natural Language                   - Schema Info
   - SQL Generation                     - Table Details
   - Smart Responses                    - Relationships


DATA FLOW FOR NATURAL LANGUAGE QUERY:
════════════════════════════════════════

1. User Question
   ↓
   "What tables are in the database?"
   ↓
2. POST /api/catalog/query
   ↓
3. Schema Explorer → PostgreSQL
   ↓
   Retrieves: Tables, Columns, Relationships
   ↓
4. AI Agent formats schema context
   ↓
5. AI Agent → Claude API
   ↓
   Sends: User Question + Schema Context
   ↓
6. Claude API processes
   ↓
   Generates: Natural Language Response
   ↓
7. Response returned to user
   ↓
   "The database contains 6 tables:
    1. users - Stores user accounts
    2. products - Product catalog
    ..."


COMPONENTS:
═══════════

┌─────────────────────────────────────────────────────────────┐
│ config/database.js                                          │
├─────────────────────────────────────────────────────────────┤
│ - PostgreSQL connection pooling                             │
│ - Query execution with monitoring                           │
│ - Transaction support                                       │
│ - Graceful error handling                                   │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ services/schemaExplorer.js                                  │
├─────────────────────────────────────────────────────────────┤
│ - getAllTables()         → List all tables                  │
│ - getTableDetails()      → Columns, types, constraints      │
│ - getAllRelationships()  → Foreign key relationships        │
│ - getSchemaOverview()    → Complete schema snapshot         │
│ - searchSchema()         → Search tables/columns            │
│ - formatSchemaForAI()    → Convert to AI-readable format    │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ services/aiAgent.js                                         │
├─────────────────────────────────────────────────────────────┤
│ - processQuery()         → Natural language Q&A             │
│ - processQueryStream()   → Streaming responses              │
│ - generateSQL()          → SQL from natural language        │
│ - checkConfiguration()   → Validate setup                   │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ routes/catalog.js                                           │
├─────────────────────────────────────────────────────────────┤
│ POST   /api/catalog/query          → Natural language Q&A   │
│ POST   /api/catalog/query/stream   → Streaming responses    │
│ POST   /api/catalog/generate-sql   → Generate SQL           │
│ GET    /api/catalog/schema         → Get schema info        │
│ GET    /api/catalog/tables         → List tables            │
│ GET    /api/catalog/relationships  → Foreign keys           │
│ GET    /api/catalog/search         → Search schema          │
│ GET    /api/catalog/health         → Health check           │
└─────────────────────────────────────────────────────────────┘


SECURITY LAYERS:
════════════════

┌───────────────────────────────┐
│  Input Validation             │
│  - Table name format check    │
│  - Query parameter validation │
└───────────────┬───────────────┘
                │
┌───────────────▼───────────────┐
│  Parameterized Queries        │
│  - No SQL injection risk      │
│  - Safe parameter binding     │
└───────────────┬───────────────┘
                │
┌───────────────▼───────────────┐
│  Safe Schema Introspection    │
│  - information_schema only    │
│  - No system catalog access   │
└───────────────┬───────────────┘
                │
┌───────────────▼───────────────┐
│  Environment Protection       │
│  - .env for secrets           │
│  - .gitignore exclusion       │
└───────────────┬───────────────┘
                │
┌───────────────▼───────────────┐
│  Graceful Error Handling      │
│  - No process crashes         │
│  - Safe error messages        │
└───────────────────────────────┘


DEPLOYMENT OPTIONS:
═══════════════════

┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│   Local Dev      │     │    Cloud         │     │  On-Premise      │
│                  │     │                  │     │                  │
│ - localhost      │     │ - AWS/GCP/Azure  │     │ - Private server │
│ - Quick testing  │     │ - Scalable       │     │ - Full control   │
│ - No cost        │     │ - Managed DBs    │     │ - Secure         │
└──────────────────┘     └──────────────────┘     └──────────────────┘


COST BREAKDOWN (Monthly):
═════════════════════════

Small Usage (100 queries/day):
  Claude API: ~$12/month
  PostgreSQL: Free (self-hosted) or ~$15/month (cloud)
  Total: ~$12-27/month

Medium Usage (1000 queries/day):
  Claude API: ~$120/month
  PostgreSQL: Free (self-hosted) or ~$50/month (cloud)
  Total: ~$120-170/month

Cost Reduction:
  - Cache schema (doesn't change often)
  - Use Claude Haiku for simple queries
  - Implement query history
  - Set token limits
```

## Comparison with Alternative Approaches

```
┌─────────────────────────────────────────────────────────────────────┐
│                    APPROACH COMPARISON                               │
├──────────────┬─────────────────┬─────────────────┬─────────────────┤
│   Feature    │   Simple API    │      n8n        │  Claude Desktop │
├──────────────┼─────────────────┼─────────────────┼─────────────────┤
│ Complexity   │  ⭐⭐ Low       │  ⭐⭐⭐ Medium  │  ⭐⭐⭐ Medium  │
│ Setup Time   │  10 minutes     │  30-60 minutes  │  20-30 minutes  │
│ Infrastructure│ Minimal        │  n8n server     │  Desktop app    │
│ Web Apps     │  ⭐⭐⭐ Perfect │  ⭐⭐ Good      │  ⭐ Limited     │
│ Deployment   │  Anywhere       │  Server needed  │  Desktop only   │
│ Customization│  Full control   │  Workflow based │  Limited        │
│ Maintenance  │  Low            │  Medium         │  Low            │
│ Cost         │  API only       │  API + hosting  │  API only       │
├──────────────┼─────────────────┼─────────────────┼─────────────────┤
│ BEST FOR:    │  Web Apps       │  Complex Flows  │  Personal Use   │
│              │  Production     │  Multi-system   │  Local Dev      │
│              │  Simplicity     │  Automation     │  Desktop Tools  │
└──────────────┴─────────────────┴─────────────────┴─────────────────┘

Winner for this use case: ⭐ Simple API Integration
```

## Technology Stack

```
┌─────────────────────────────────────────────────────────┐
│                   TECHNOLOGY STACK                      │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Backend Framework:     Express.js                      │
│  Language:             Node.js                          │
│  Database:             PostgreSQL 12+                   │
│  AI Service:           Claude 3.5 Sonnet (Anthropic)    │
│                                                         │
│  Key Libraries:                                         │
│  ├─ pg                 PostgreSQL client                │
│  ├─ @anthropic-ai/sdk  Claude API                       │
│  ├─ dotenv             Environment config               │
│  └─ express            Web framework                    │
│                                                         │
│  Development:                                           │
│  ├─ Node.js 14+        Runtime                          │
│  ├─ npm                Package manager                  │
│  └─ Git                Version control                  │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

This architecture provides a clean separation of concerns, strong security, and easy extensibility for future enhancements.
