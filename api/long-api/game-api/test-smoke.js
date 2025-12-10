#!/usr/bin/env node

/**
 * Basic Smoke Test for AI Agent Data Catalog
 * 
 * This script verifies that all modules can be loaded and basic
 * functions are available without requiring database or API connections.
 */

console.log('🧪 Running AI Agent Data Catalog Smoke Tests...\n');

let passedTests = 0;
let failedTests = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`✅ ${name}`);
    passedTests++;
  } catch (error) {
    console.log(`❌ ${name}`);
    console.error(`   Error: ${error.message}`);
    failedTests++;
  }
}

// Test 1: Load database config module
test('Load database config module', () => {
  const db = require('./config/database');
  if (!db.query || typeof db.query !== 'function') {
    throw new Error('database.query function not found');
  }
  if (!db.getClient || typeof db.getClient !== 'function') {
    throw new Error('database.getClient function not found');
  }
});

// Test 2: Load schema explorer module
test('Load schema explorer module', () => {
  const schemaExplorer = require('./services/schemaExplorer');
  if (!schemaExplorer.getAllTables || typeof schemaExplorer.getAllTables !== 'function') {
    throw new Error('schemaExplorer.getAllTables function not found');
  }
  if (!schemaExplorer.getTableDetails || typeof schemaExplorer.getTableDetails !== 'function') {
    throw new Error('schemaExplorer.getTableDetails function not found');
  }
  if (!schemaExplorer.formatSchemaForAI || typeof schemaExplorer.formatSchemaForAI !== 'function') {
    throw new Error('schemaExplorer.formatSchemaForAI function not found');
  }
});

// Test 3: Load AI agent module
test('Load AI agent module', () => {
  const aiAgent = require('./services/aiAgent');
  if (!aiAgent.processQuery || typeof aiAgent.processQuery !== 'function') {
    throw new Error('aiAgent.processQuery function not found');
  }
  if (!aiAgent.generateSQL || typeof aiAgent.generateSQL !== 'function') {
    throw new Error('aiAgent.generateSQL function not found');
  }
  if (!aiAgent.checkConfiguration || typeof aiAgent.checkConfiguration !== 'function') {
    throw new Error('aiAgent.checkConfiguration function not found');
  }
});

// Test 4: Load catalog routes
test('Load catalog routes', () => {
  const catalogRouter = require('./routes/catalog');
  if (typeof catalogRouter !== 'function') {
    throw new Error('catalog router is not a valid Express router');
  }
});

// Test 5: Load main app
test('Load main Express app', () => {
  const app = require('./app');
  if (typeof app !== 'function') {
    throw new Error('app is not a valid Express application');
  }
});

// Test 6: Test schema formatter with mock data
test('Schema formatter produces string output', () => {
  const schemaExplorer = require('./services/schemaExplorer');
  const mockSchema = {
    totalTables: 2,
    totalRelationships: 1,
    tables: [
      {
        table_name: 'users',
        table_type: 'BASE TABLE',
        size: '16 kB',
        columns: [
          {
            column_name: 'id',
            data_type: 'integer',
            is_nullable: 'NO',
            column_default: 'nextval(\'users_id_seq\'::regclass)'
          },
          {
            column_name: 'username',
            data_type: 'character varying',
            character_maximum_length: 100,
            is_nullable: 'NO',
            column_default: null
          }
        ],
        primaryKeys: ['id'],
        foreignKeys: []
      },
      {
        table_name: 'orders',
        table_type: 'BASE TABLE',
        size: '8 kB',
        columns: [
          {
            column_name: 'id',
            data_type: 'integer',
            is_nullable: 'NO',
            column_default: 'nextval(\'orders_id_seq\'::regclass)'
          },
          {
            column_name: 'user_id',
            data_type: 'integer',
            is_nullable: 'NO',
            column_default: null
          }
        ],
        primaryKeys: ['id'],
        foreignKeys: [
          {
            column_name: 'user_id',
            foreign_table_name: 'users',
            foreign_column_name: 'id'
          }
        ]
      }
    ]
  };
  
  const formatted = schemaExplorer.formatSchemaForAI(mockSchema);
  if (typeof formatted !== 'string') {
    throw new Error('formatSchemaForAI did not return a string');
  }
  if (formatted.length === 0) {
    throw new Error('formatSchemaForAI returned empty string');
  }
  if (!formatted.includes('users')) {
    throw new Error('formatSchemaForAI did not include table name');
  }
});

// Test 7: Check configuration function
test('Configuration check function works', () => {
  const aiAgent = require('./services/aiAgent');
  const config = aiAgent.checkConfiguration();
  if (typeof config !== 'object') {
    throw new Error('checkConfiguration did not return an object');
  }
  if (typeof config.configured !== 'boolean') {
    throw new Error('checkConfiguration result missing "configured" boolean');
  }
  if (typeof config.message !== 'string') {
    throw new Error('checkConfiguration result missing "message" string');
  }
});

// Test 8: Verify environment example file exists
test('Environment example file exists', () => {
  const fs = require('fs');
  const path = require('path');
  const envExamplePath = path.join(__dirname, '.env.example');
  if (!fs.existsSync(envExamplePath)) {
    throw new Error('.env.example file not found');
  }
  const content = fs.readFileSync(envExamplePath, 'utf8');
  if (!content.includes('ANTHROPIC_API_KEY')) {
    throw new Error('.env.example missing ANTHROPIC_API_KEY');
  }
  if (!content.includes('DB_HOST')) {
    throw new Error('.env.example missing DB_HOST');
  }
});

// Test 9: Verify SQL setup script exists
test('SQL setup script exists', () => {
  const fs = require('fs');
  const path = require('path');
  const sqlPath = path.join(__dirname, 'setup_database.sql');
  if (!fs.existsSync(sqlPath)) {
    throw new Error('setup_database.sql file not found');
  }
  const content = fs.readFileSync(sqlPath, 'utf8');
  if (!content.includes('CREATE TABLE')) {
    throw new Error('setup_database.sql missing CREATE TABLE statements');
  }
});

// Test 10: Verify README exists
test('README file exists', () => {
  const fs = require('fs');
  const path = require('path');
  const readmePath = path.join(__dirname, 'README.md');
  if (!fs.existsSync(readmePath)) {
    throw new Error('README.md file not found');
  }
  const content = fs.readFileSync(readmePath, 'utf8');
  if (!content.includes('AI Data Catalog')) {
    throw new Error('README.md missing AI Data Catalog documentation');
  }
});

// Print summary
console.log('\n' + '='.repeat(50));
console.log(`Tests Passed: ${passedTests}`);
console.log(`Tests Failed: ${failedTests}`);
console.log('='.repeat(50));

if (failedTests > 0) {
  console.log('\n❌ Some tests failed!');
  process.exit(1);
} else {
  console.log('\n✅ All tests passed!');
  console.log('\n📝 Note: These are basic smoke tests.');
  console.log('   To fully test the AI agent, you need to:');
  console.log('   1. Set up a PostgreSQL database');
  console.log('   2. Configure .env with ANTHROPIC_API_KEY');
  console.log('   3. Start the server and test endpoints');
  console.log('\n   See SETUP_GUIDE.md for complete instructions.');
  process.exit(0);
}
