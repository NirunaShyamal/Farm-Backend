const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');
const connectDB = require('../config/database');

const execAsync = promisify(exec);

/**
 * Database Backup and Restore Script
 * This script provides functionality to backup and restore the MongoDB database
 */

const backupDatabase = async (options = {}) => {
  try {
    console.log('💾 Starting database backup...');
    
    const {
      outputDir = './backups',
      includeTimestamp = true,
      compress = true,
      collections = null // null means backup all collections
    } = options;
    
    // Create backup directory if it doesn't exist
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // Generate backup filename
    const timestamp = includeTimestamp ? `_${new Date().toISOString().replace(/[:.]/g, '-')}` : '';
    const backupName = `farm_management_backup${timestamp}`;
    const backupPath = path.join(outputDir, backupName);
    
    // Get MongoDB connection details from environment
    const mongoUri = process.env.MONGO_URI;
    const dbName = process.env.DB_NAME || 'farm_management';
    
    if (!mongoUri) {
      throw new Error('MONGO_URI environment variable is required');
    }
    
    // Build mongodump command
    let command = `mongodump --uri="${mongoUri}" --db="${dbName}" --out="${backupPath}"`;
    
    // Add collection filter if specified
    if (collections && Array.isArray(collections)) {
      collections.forEach(collection => {
        command += ` --collection="${collection}"`;
      });
    }
    
    // Execute backup
    console.log(`📦 Creating backup: ${backupName}`);
    const { stdout, stderr } = await execAsync(command);
    
    if (stderr && !stderr.includes('done dumping')) {
      console.warn('⚠️ Backup warnings:', stderr);
    }
    
    // Compress backup if requested
    if (compress) {
      console.log('🗜️ Compressing backup...');
      const compressCommand = `tar -czf "${backupPath}.tar.gz" -C "${outputDir}" "${backupName}"`;
      await execAsync(compressCommand);
      
      // Remove uncompressed directory
      await execAsync(`rm -rf "${backupPath}"`);
      console.log(`✅ Backup compressed: ${backupName}.tar.gz`);
    } else {
      console.log(`✅ Backup created: ${backupName}`);
    }
    
    // Create backup metadata
    const metadata = {
      timestamp: new Date().toISOString(),
      database: dbName,
      collections: collections || 'all',
      compressed: compress,
      size: await getBackupSize(compress ? `${backupPath}.tar.gz` : backupPath),
      version: '1.0.0'
    };
    
    const metadataPath = compress ? `${backupPath}.metadata.json` : path.join(backupPath, 'backup_metadata.json');
    fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
    
    console.log('✅ Database backup completed successfully!');
    return {
      success: true,
      backupPath: compress ? `${backupPath}.tar.gz` : backupPath,
      metadata
    };
    
  } catch (error) {
    console.error('❌ Database backup failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

const restoreDatabase = async (backupPath, options = {}) => {
  try {
    console.log('🔄 Starting database restore...');
    
    const {
      dropExisting = false,
      collections = null // null means restore all collections
    } = options;
    
    // Check if backup exists
    if (!fs.existsSync(backupPath)) {
      throw new Error(`Backup file not found: ${backupPath}`);
    }
    
    // Get MongoDB connection details
    const mongoUri = process.env.MONGO_URI;
    const dbName = process.env.DB_NAME || 'farm_management';
    
    if (!mongoUri) {
      throw new Error('MONGO_URI environment variable is required');
    }
    
    let restorePath = backupPath;
    
    // Extract compressed backup if needed
    if (backupPath.endsWith('.tar.gz')) {
      console.log('📦 Extracting compressed backup...');
      const extractDir = path.dirname(backupPath);
      const extractCommand = `tar -xzf "${backupPath}" -C "${extractDir}"`;
      await execAsync(extractCommand);
      
      // Find the extracted directory
      const extractedName = path.basename(backupPath, '.tar.gz');
      restorePath = path.join(extractDir, extractedName, dbName);
    }
    
    // Build mongorestore command
    let command = `mongorestore --uri="${mongoUri}" --db="${dbName}"`;
    
    if (dropExisting) {
      command += ' --drop';
    }
    
    if (collections && Array.isArray(collections)) {
      collections.forEach(collection => {
        command += ` --collection="${collection}"`;
      });
    }
    
    command += ` "${restorePath}"`;
    
    // Execute restore
    console.log(`🔄 Restoring from: ${restorePath}`);
    const { stdout, stderr } = await execAsync(command);
    
    if (stderr && !stderr.includes('done')) {
      console.warn('⚠️ Restore warnings:', stderr);
    }
    
    // Clean up extracted files if they were compressed
    if (backupPath.endsWith('.tar.gz')) {
      const extractedDir = path.dirname(restorePath);
      await execAsync(`rm -rf "${extractedDir}"`);
    }
    
    console.log('✅ Database restore completed successfully!');
    return {
      success: true,
      message: 'Database restored successfully'
    };
    
  } catch (error) {
    console.error('❌ Database restore failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

const listBackups = async (backupDir = './backups') => {
  try {
    if (!fs.existsSync(backupDir)) {
      return [];
    }
    
    const files = fs.readdirSync(backupDir);
    const backups = [];
    
    for (const file of files) {
      const filePath = path.join(backupDir, file);
      const stats = fs.statSync(filePath);
      
      if (file.endsWith('.tar.gz') || file.endsWith('.metadata.json')) {
        const backupName = file.replace(/\.(tar\.gz|metadata\.json)$/, '');
        const metadataPath = path.join(backupDir, `${backupName}.metadata.json`);
        
        let metadata = null;
        if (fs.existsSync(metadataPath)) {
          metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
        }
        
        backups.push({
          name: backupName,
          path: filePath,
          size: stats.size,
          created: stats.birthtime,
          modified: stats.mtime,
          metadata
        });
      }
    }
    
    return backups.sort((a, b) => b.created - a.created);
    
  } catch (error) {
    console.error('❌ Error listing backups:', error);
    return [];
  }
};

const cleanupOldBackups = async (backupDir = './backups', retentionDays = 30) => {
  try {
    console.log(`🧹 Cleaning up backups older than ${retentionDays} days...`);
    
    const backups = await listBackups(backupDir);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
    
    let deletedCount = 0;
    
    for (const backup of backups) {
      if (backup.created < cutoffDate) {
        try {
          fs.unlinkSync(backup.path);
          deletedCount++;
          console.log(`🗑️ Deleted old backup: ${backup.name}`);
        } catch (error) {
          console.warn(`⚠️ Could not delete backup ${backup.name}:`, error.message);
        }
      }
    }
    
    console.log(`✅ Cleanup completed. Deleted ${deletedCount} old backups.`);
    return deletedCount;
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    return 0;
  }
};

const getBackupSize = async (filePath) => {
  try {
    const stats = fs.statSync(filePath);
    return stats.size;
  } catch (error) {
    return 0;
  }
};

const scheduleBackup = async (schedule = '0 2 * * *') => {
  try {
    console.log(`⏰ Scheduling automatic backups: ${schedule}`);
    
    // This would typically integrate with a cron job scheduler
    // For now, we'll just log the schedule
    console.log('📝 To set up automatic backups, add this to your crontab:');
    console.log(`${schedule} cd ${process.cwd()} && node src/scripts/backupDatabase.js --auto`);
    
    return {
      success: true,
      schedule,
      message: 'Backup schedule configured'
    };
    
  } catch (error) {
    console.error('❌ Error scheduling backup:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// CLI interface
const main = async () => {
  const args = process.argv.slice(2);
  const command = args[0];
  
  try {
    switch (command) {
      case 'backup':
        const backupOptions = {
          outputDir: args.includes('--output') ? args[args.indexOf('--output') + 1] : './backups',
          includeTimestamp: !args.includes('--no-timestamp'),
          compress: !args.includes('--no-compress'),
          collections: args.includes('--collections') ? 
            args[args.indexOf('--collections') + 1].split(',') : null
        };
        await backupDatabase(backupOptions);
        break;
        
      case 'restore':
        if (args.length < 2) {
          console.error('❌ Please provide backup path: node backupDatabase.js restore <backup_path>');
          process.exit(1);
        }
        const restoreOptions = {
          dropExisting: args.includes('--drop'),
          collections: args.includes('--collections') ? 
            args[args.indexOf('--collections') + 1].split(',') : null
        };
        await restoreDatabase(args[1], restoreOptions);
        break;
        
      case 'list':
        const backups = await listBackups();
        console.log('📋 Available backups:');
        backups.forEach(backup => {
          console.log(`  - ${backup.name} (${new Date(backup.created).toLocaleString()})`);
        });
        break;
        
      case 'cleanup':
        const retentionDays = args.includes('--days') ? 
          parseInt(args[args.indexOf('--days') + 1]) : 30;
        await cleanupOldBackups('./backups', retentionDays);
        break;
        
      case 'schedule':
        const schedule = args[1] || '0 2 * * *';
        await scheduleBackup(schedule);
        break;
        
      default:
        console.log(`
🗄️ Farm Management Database Backup Tool

Usage:
  node backupDatabase.js <command> [options]

Commands:
  backup                    Create a new backup
  restore <backup_path>     Restore from backup
  list                      List available backups
  cleanup                   Clean up old backups
  schedule [cron_expr]      Schedule automatic backups

Options:
  --output <dir>            Backup output directory (default: ./backups)
  --no-timestamp           Don't include timestamp in backup name
  --no-compress            Don't compress backup
  --collections <list>     Comma-separated list of collections
  --drop                   Drop existing data before restore
  --days <number>          Retention days for cleanup (default: 30)

Examples:
  node backupDatabase.js backup
  node backupDatabase.js backup --no-compress --output /custom/path
  node backupDatabase.js restore ./backups/farm_management_backup_2024-01-15.tar.gz
  node backupDatabase.js restore ./backups/backup --drop
  node backupDatabase.js list
  node backupDatabase.js cleanup --days 7
  node backupDatabase.js schedule "0 2 * * *"
        `);
    }
  } catch (error) {
    console.error('❌ Command failed:', error.message);
    process.exit(1);
  }
};

// Run CLI if this script is executed directly
if (require.main === module) {
  main();
}

module.exports = {
  backupDatabase,
  restoreDatabase,
  listBackups,
  cleanupOldBackups,
  scheduleBackup
};

