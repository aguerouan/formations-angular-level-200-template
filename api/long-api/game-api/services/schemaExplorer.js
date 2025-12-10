const db = require('../config/database');

/**
 * Schema Explorer Service
 * 
 * Provides utilities to explore PostgreSQL database schema including
 * tables, columns, relationships, and other metadata.
 */

/**
 * Get all tables in the database
 * @returns {Promise<Array>} List of tables with basic information
 */
async function getAllTables() {
  const query = `
    SELECT 
      table_name,
      table_type
    FROM information_schema.tables
    WHERE table_schema = 'public'
    ORDER BY table_name;
  `;
  
  try {
    const result = await db.query(query);
    return result.rows;
  } catch (error) {
    console.error('Error fetching tables:', error);
    throw error;
  }
}

/**
 * Get detailed information about a specific table
 * @param {string} tableName - Name of the table
 * @returns {Promise<Object>} Table details including columns and constraints
 */
async function getTableDetails(tableName) {
  try {
    // Validate table name - only allow alphanumeric and underscore
    if (!/^[a-zA-Z0-9_]+$/.test(tableName)) {
      throw new Error('Invalid table name format');
    }
    
    // Get column information
    const columnsQuery = `
      SELECT 
        column_name,
        data_type,
        character_maximum_length,
        is_nullable,
        column_default
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = $1
      ORDER BY ordinal_position;
    `;
    
    // Get primary key information using information_schema
    const primaryKeyQuery = `
      SELECT kcu.column_name
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu 
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      WHERE tc.constraint_type = 'PRIMARY KEY'
        AND tc.table_schema = 'public'
        AND tc.table_name = $1;
    `;
    
    // Get foreign key information
    const foreignKeysQuery = `
      SELECT
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_name = $1;
    `;
    
    const [columns, primaryKeys, foreignKeys] = await Promise.all([
      db.query(columnsQuery, [tableName]),
      db.query(primaryKeyQuery, [tableName]),
      db.query(foreignKeysQuery, [tableName])
    ]);
    
    return {
      tableName,
      columns: columns.rows,
      primaryKeys: primaryKeys.rows.map(row => row.column_name),
      foreignKeys: foreignKeys.rows
    };
  } catch (error) {
    console.error(`Error fetching details for table ${tableName}:`, error);
    throw error;
  }
}

/**
 * Get all relationships (foreign keys) in the database
 * @returns {Promise<Array>} List of all foreign key relationships
 */
async function getAllRelationships() {
  const query = `
    SELECT
      tc.table_name,
      kcu.column_name,
      ccu.table_name AS foreign_table_name,
      ccu.column_name AS foreign_column_name,
      tc.constraint_name
    FROM information_schema.table_constraints AS tc
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_schema = 'public'
    ORDER BY tc.table_name, kcu.column_name;
  `;
  
  try {
    const result = await db.query(query);
    return result.rows;
  } catch (error) {
    console.error('Error fetching relationships:', error);
    throw error;
  }
}

/**
 * Get complete database schema overview
 * @returns {Promise<Object>} Complete schema information
 */
async function getSchemaOverview() {
  try {
    const tables = await getAllTables();
    const relationships = await getAllRelationships();
    
    // Get detailed info for each table
    const tablesWithDetails = await Promise.all(
      tables.map(async (table) => {
        const details = await getTableDetails(table.table_name);
        return {
          ...table,
          ...details
        };
      })
    );
    
    return {
      tables: tablesWithDetails,
      relationships,
      totalTables: tables.length,
      totalRelationships: relationships.length
    };
  } catch (error) {
    console.error('Error fetching schema overview:', error);
    throw error;
  }
}

/**
 * Search for tables or columns matching a pattern
 * @param {string} searchTerm - Search term to match against table/column names
 * @returns {Promise<Object>} Matching tables and columns
 */
async function searchSchema(searchTerm) {
  const tablesQuery = `
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name ILIKE $1
    ORDER BY table_name;
  `;
  
  const columnsQuery = `
    SELECT table_name, column_name, data_type
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND column_name ILIKE $1
    ORDER BY table_name, column_name;
  `;
  
  try {
    const searchPattern = `%${searchTerm}%`;
    const [tables, columns] = await Promise.all([
      db.query(tablesQuery, [searchPattern]),
      db.query(columnsQuery, [searchPattern])
    ]);
    
    return {
      matchingTables: tables.rows,
      matchingColumns: columns.rows
    };
  } catch (error) {
    console.error('Error searching schema:', error);
    throw error;
  }
}

/**
 * Format schema information as a readable string for AI context
 * @param {Object} schema - Schema overview object
 * @returns {string} Formatted schema description
 */
function formatSchemaForAI(schema) {
  let description = `Database Schema Overview:\n\n`;
  description += `Total Tables: ${schema.totalTables}\n`;
  description += `Total Relationships: ${schema.totalRelationships}\n\n`;
  
  description += `Tables:\n`;
  schema.tables.forEach(table => {
    description += `\n- ${table.table_name} (${table.table_type})\n`;
    
    if (table.primaryKeys && table.primaryKeys.length > 0) {
      description += `  Primary Key: ${table.primaryKeys.join(', ')}\n`;
    }
    
    description += `  Columns:\n`;
    table.columns.forEach(col => {
      description += `    - ${col.column_name}: ${col.data_type}`;
      if (col.character_maximum_length) {
        description += `(${col.character_maximum_length})`;
      }
      description += ` ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'}`;
      if (col.column_default) {
        description += ` DEFAULT ${col.column_default}`;
      }
      description += `\n`;
    });
    
    if (table.foreignKeys && table.foreignKeys.length > 0) {
      description += `  Foreign Keys:\n`;
      table.foreignKeys.forEach(fk => {
        description += `    - ${fk.column_name} → ${fk.foreign_table_name}.${fk.foreign_column_name}\n`;
      });
    }
  });
  
  return description;
}

module.exports = {
  getAllTables,
  getTableDetails,
  getAllRelationships,
  getSchemaOverview,
  searchSchema,
  formatSchemaForAI
};
