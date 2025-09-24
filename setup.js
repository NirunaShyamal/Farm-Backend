#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

/**
 * Farm Management Database Setup Script
 * This script helps set up the database for the farm management system
 */

const setupDatabase = async () => {
  try {
    console.log('🚀 Farm Management Database Setup');
    console.log('=' .repeat(40));
    
    // Check if .env file exists
    const envPath = path.join(__dirname, '.env');
    if (!fs.existsSync(envPath)) {
      console.log('⚠️ .env file not found. Please create one based on env.example');
      console.log('📝 Copy env.example to .env and update the values:');
      console.log('   cp env.example .env');
      console.log('   # Then edit .env with your MongoDB connection details');
      return;
    }
    
    // Check if node_modules exists
    const nodeModulesPath = path.join(__dirname, 'node_modules');
    if (!fs.existsSync(nodeModulesPath)) {
      console.log('📦 Installing dependencies...');
      await execAsync('npm install');
      console.log('✅ Dependencies installed');
    }
    
    // Initialize database
    console.log('\n🗄️ Initializing database...');
    try {
      await execAsync('node src/scripts/initDatabase.js');
      console.log('✅ Database initialized successfully');
    } catch (error) {
      console.error('❌ Database initialization failed:', error.message);
      console.log('💡 Make sure your MongoDB connection is working and .env is configured correctly');
      return;
    }
    
    // Ask if user wants to seed with sample data
    console.log('\n🌱 Would you like to add sample data for testing? (y/n)');
    console.log('   This will add comprehensive sample data to help you get started');
    
    // For automated setup, we'll skip the interactive part
    // In a real scenario, you'd use readline or similar for user input
    console.log('💡 To add sample data, run: npm run db:seed');
    
    // Check database status
    console.log('\n🔍 Checking database status...');
    try {
      await execAsync('node src/scripts/checkDatabaseStatus.js');
    } catch (error) {
      console.log('⚠️ Could not check database status:', error.message);
    }
    
    console.log('\n🎉 Setup completed successfully!');
    console.log('\n📋 Next steps:');
    console.log('   1. Start the server: npm start');
    console.log('   2. Or start in development mode: npm run dev');
    console.log('   3. Check database status: npm run db:status');
    console.log('   4. Add sample data: npm run db:seed');
    console.log('   5. Create backup: npm run db:backup');
    
    console.log('\n📚 For more information, see DATABASE_SETUP.md');
    
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    process.exit(1);
  }
};

const showHelp = () => {
  console.log(`
🚀 Farm Management Database Setup

Usage:
  node setup.js [options]

Options:
  --help, -h     Show this help message

This script will:
- Check for required files (.env, node_modules)
- Install dependencies if needed
- Initialize the database with indexes
- Check database status
- Provide next steps

Prerequisites:
- Node.js installed
- MongoDB Atlas account or local MongoDB
- .env file configured (copy from env.example)

Examples:
  node setup.js
  npm run setup
  `);
};

const main = async () => {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    showHelp();
    return;
  }
  
  await setupDatabase();
};

// Run if this script is executed directly
if (require.main === module) {
  main();
}

module.exports = { setupDatabase };
