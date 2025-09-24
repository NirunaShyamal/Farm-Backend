# Farm Management Database Setup Guide

This guide provides comprehensive instructions for setting up, managing, and maintaining the MongoDB database for the Farm Management System.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Database Configuration](#database-configuration)
3. [Initial Setup](#initial-setup)
4. [Database Scripts](#database-scripts)
5. [Backup and Restore](#backup-and-restore)
6. [Maintenance](#maintenance)
7. [Troubleshooting](#troubleshooting)

## Prerequisites

Before setting up the database, ensure you have:

- Node.js (v14 or higher)
- MongoDB Atlas account or local MongoDB installation
- Access to the farm-backend project directory

## Database Configuration

### Environment Variables

Create a `.env` file in the `farm-backend` directory with the following variables:

```env
# Database Configuration
PORT=5000
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/?retryWrites=true&w=majority&appName=ClusterName
DB_NAME=farm_management

# JWT Configuration
JWT_SECRET=your_jwt_secret_key_here_change_in_production_2024

# Environment
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# Database Connection Options
DB_CONNECTION_TIMEOUT=30000
DB_SOCKET_TIMEOUT=45000
DB_MAX_POOL_SIZE=10
DB_MIN_POOL_SIZE=5

# Backup Configuration
BACKUP_ENABLED=true
BACKUP_SCHEDULE=0 2 * * *
BACKUP_RETENTION_DAYS=30
```

### MongoDB Atlas Setup

1. **Create a MongoDB Atlas Account**
   - Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
   - Sign up for a free account

2. **Create a Cluster**
   - Choose the free M0 tier
   - Select your preferred region
   - Create the cluster

3. **Configure Database Access**
   - Go to "Database Access" in the left sidebar
   - Add a new database user
   - Set username and password
   - Grant "Read and write to any database" privileges

4. **Configure Network Access**
   - Go to "Network Access" in the left sidebar
   - Add IP address (0.0.0.0/0 for development, specific IPs for production)
   - Or add your current IP address

5. **Get Connection String**
   - Go to "Clusters" and click "Connect"
   - Choose "Connect your application"
   - Copy the connection string
   - Replace `<password>` with your database user password
   - Replace `<dbname>` with your database name

## Initial Setup

### 1. Install Dependencies

```bash
cd farm-backend
npm install
```

### 2. Initialize Database

Run the database initialization script to create indexes and sample data:

```bash
# Initialize database with sample data
node src/scripts/initDatabase.js
```

This script will:
- Connect to your MongoDB database
- Create performance indexes
- Add sample data if the database is empty
- Set up proper database structure

### 3. Seed Database (Optional)

For development and testing, you can populate the database with comprehensive sample data:

```bash
# Seed database with extensive sample data
node src/scripts/seedDatabase.js
```

## Database Scripts

### Available Scripts

The following scripts are available in the `src/scripts/` directory:

#### 1. `initDatabase.js`
- **Purpose**: Initialize database with indexes and basic sample data
- **Usage**: `node src/scripts/initDatabase.js`
- **Features**:
  - Creates performance indexes
  - Adds sample data if database is empty
  - Sets up database structure

#### 2. `seedDatabase.js`
- **Purpose**: Populate database with comprehensive sample data
- **Usage**: `node src/scripts/seedDatabase.js`
- **Features**:
  - Adds extensive sample data for all collections
  - Useful for development and testing
  - Can clear existing data (uncomment clearDatabase() call)

#### 3. `backupDatabase.js`
- **Purpose**: Backup and restore database
- **Usage**: See [Backup and Restore](#backup-and-restore) section

### Adding Scripts to package.json

Add these scripts to your `package.json` for easier access:

```json
{
  "scripts": {
    "db:init": "node src/scripts/initDatabase.js",
    "db:seed": "node src/scripts/seedDatabase.js",
    "db:backup": "node src/scripts/backupDatabase.js backup",
    "db:restore": "node src/scripts/backupDatabase.js restore",
    "db:list": "node src/scripts/backupDatabase.js list",
    "db:cleanup": "node src/scripts/backupDatabase.js cleanup"
  }
}
```

Then you can run:
```bash
npm run db:init
npm run db:seed
npm run db:backup
```

## Database Schema

### Collections Overview

The database contains the following collections:

#### 1. Egg Production (`eggproductions`)
- **Purpose**: Track daily egg production data
- **Key Fields**: date, batchNumber, birds, eggsCollected, damagedEggs, eggProductionRate
- **Indexes**: date, batchNumber, date (descending)

#### 2. Sales Orders (`salesorders`)
- **Purpose**: Manage customer orders and sales
- **Key Fields**: orderNumber, customerName, productType, quantity, unitPrice, status
- **Indexes**: orderNumber (unique), customerName, orderDate (descending), status

#### 3. Feed Inventory (`feedinventories`)
- **Purpose**: Track feed stock and inventory
- **Key Fields**: type, quantity, supplier, expiryDate, isLowStock
- **Indexes**: type, isLowStock, expiryDate

#### 4. Task Scheduling (`taskschedulings`)
- **Purpose**: Manage farm tasks and schedules
- **Key Fields**: date, taskDescription, category, assignedTo, status, priority
- **Indexes**: date+time, assignedTo, status, category

#### 5. Financial Records (`financialrecords`)
- **Purpose**: Track income and expenses
- **Key Fields**: date, description, category, amount, paymentMethod, reference
- **Indexes**: date+category, reference (unique), customerSupplier, subcategory

## Backup and Restore

### Creating Backups

```bash
# Create a basic backup
node src/scripts/backupDatabase.js backup

# Create backup without compression
node src/scripts/backupDatabase.js backup --no-compress

# Create backup to custom directory
node src/scripts/backupDatabase.js backup --output /path/to/backups

# Create backup of specific collections
node src/scripts/backupDatabase.js backup --collections eggproductions,salesorders
```

### Restoring Backups

```bash
# Restore from backup
node src/scripts/backupDatabase.js restore ./backups/farm_management_backup_2024-01-15.tar.gz

# Restore and drop existing data
node src/scripts/backupDatabase.js restore ./backups/backup --drop

# Restore specific collections
node src/scripts/backupDatabase.js restore ./backups/backup --collections eggproductions,salesorders
```

### Listing and Managing Backups

```bash
# List all available backups
node src/scripts/backupDatabase.js list

# Clean up old backups (older than 30 days)
node src/scripts/backupDatabase.js cleanup

# Clean up old backups (older than 7 days)
node src/scripts/backupDatabase.js cleanup --days 7
```

### Automatic Backups

Set up automatic backups using cron:

```bash
# Edit crontab
crontab -e

# Add this line for daily backups at 2 AM
0 2 * * * cd /path/to/farm-backend && node src/scripts/backupDatabase.js backup
```

## Maintenance

### Regular Maintenance Tasks

1. **Monitor Database Size**
   ```bash
   # Check database size in MongoDB Atlas dashboard
   # Or use MongoDB Compass to view collection sizes
   ```

2. **Clean Up Old Data**
   ```bash
   # Remove old backups
   node src/scripts/backupDatabase.js cleanup --days 30
   ```

3. **Update Indexes**
   - Indexes are automatically created during initialization
   - Monitor query performance and add indexes as needed

4. **Monitor Performance**
   - Use MongoDB Atlas monitoring tools
   - Check slow query logs
   - Monitor connection pool usage

### Database Optimization

1. **Index Optimization**
   - Review query patterns
   - Add compound indexes for frequently queried fields
   - Remove unused indexes

2. **Connection Pool Tuning**
   - Adjust `DB_MAX_POOL_SIZE` and `DB_MIN_POOL_SIZE` based on usage
   - Monitor connection metrics

3. **Data Archiving**
   - Consider archiving old financial records
   - Archive completed tasks older than 1 year

## Troubleshooting

### Common Issues

#### 1. Connection Issues

**Error**: `MongoServerError: Authentication failed`

**Solution**:
- Check username and password in MONGO_URI
- Verify database user has correct permissions
- Ensure network access is configured

#### 2. Index Creation Errors

**Error**: `Index creation failed`

**Solution**:
- Check if indexes already exist
- Verify collection names are correct
- Ensure sufficient database permissions

#### 3. Backup/Restore Issues

**Error**: `mongodump not found`

**Solution**:
- Install MongoDB Database Tools
- Add MongoDB tools to PATH
- Use MongoDB Atlas backup tools as alternative

#### 4. Memory Issues

**Error**: `Out of memory during backup`

**Solution**:
- Use collection-specific backups
- Increase available memory
- Use MongoDB Atlas backup tools

### Performance Issues

#### Slow Queries
1. Check if proper indexes exist
2. Use MongoDB Compass to analyze query performance
3. Consider adding compound indexes

#### High Memory Usage
1. Monitor connection pool size
2. Check for memory leaks in application
3. Optimize query patterns

### Getting Help

1. **Check Logs**
   - Application logs in console
   - MongoDB Atlas logs in dashboard

2. **Database Status**
   ```bash
   # Check database connection
   curl http://localhost:5000/api/health
   ```

3. **MongoDB Resources**
   - [MongoDB Documentation](https://docs.mongodb.com/)
   - [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com/)
   - [MongoDB University](https://university.mongodb.com/)

## Security Best Practices

1. **Environment Variables**
   - Never commit `.env` files to version control
   - Use strong, unique passwords
   - Rotate JWT secrets regularly

2. **Database Access**
   - Use least privilege principle
   - Enable IP whitelisting in production
   - Use MongoDB Atlas built-in security features

3. **Backup Security**
   - Encrypt backup files
   - Store backups in secure locations
   - Test restore procedures regularly

4. **Network Security**
   - Use TLS/SSL connections
   - Implement proper firewall rules
   - Monitor access logs

## Production Deployment

### Pre-deployment Checklist

- [ ] Update JWT_SECRET to a strong, unique value
- [ ] Set NODE_ENV to 'production'
- [ ] Configure proper CORS settings
- [ ] Set up database backups
- [ ] Configure monitoring and logging
- [ ] Test all database operations
- [ ] Verify backup and restore procedures

### Production Environment Variables

```env
NODE_ENV=production
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/?retryWrites=true&w=majority&appName=ProductionCluster
DB_NAME=farm_management_prod
JWT_SECRET=your_very_strong_production_secret_key
FRONTEND_URL=https://yourdomain.com
```

---

For additional support or questions, please refer to the project documentation or contact the development team.
