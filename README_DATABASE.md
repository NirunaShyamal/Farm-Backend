
# Farm Management Database - Quick Start Guide

## 🚀 Quick Setup

1. **Configure Environment**
   ```bash
   cp env.example .env
   # Edit .env with your MongoDB connection details
   ```

2. **Run Setup Script**
   ```bash
   npm run setup
   ```

3. **Start the Server**
   ```bash
   npm start
   # or for development
   npm run dev
   ```

## 📋 Available Database Commands

| Command | Description |
|---------|-------------|
| `npm run setup` | Complete database setup |
| `npm run db:init` | Initialize database with indexes |
| `npm run db:seed` | Add sample data for testing |
| `npm run db:status` | Check database health |
| `npm run db:backup` | Create database backup |
| `npm run db:restore` | Restore from backup |
| `npm run db:list` | List available backups |
| `npm run db:cleanup` | Clean up old backups |

## 🗄️ Database Collections

- **Egg Production** - Daily egg collection data
- **Sales Orders** - Customer orders and sales
- **Feed Inventory** - Feed stock management
- **Task Scheduling** - Farm task management
- **Financial Records** - Income and expense tracking

## 📊 Database Features

✅ **Automatic Indexing** - Performance optimized queries  
✅ **Data Validation** - Built-in schema validation  
✅ **Backup System** - Automated backup and restore  
✅ **Health Monitoring** - Database status checking  
✅ **Sample Data** - Ready-to-use test data  
✅ **Documentation** - Comprehensive setup guide  

## 🔧 Configuration

The database uses MongoDB with the following configuration:

- **Connection**: MongoDB Atlas (cloud) or local MongoDB
- **Database Name**: `farm_management`
- **Models**: 5 main collections with proper relationships
- **Indexes**: Optimized for common query patterns
- **Validation**: Schema-level data validation

## 📚 Documentation

- **Full Setup Guide**: `DATABASE_SETUP.md`
- **API Documentation**: Check individual model files
- **Environment Variables**: `env.example`

## 🆘 Troubleshooting

### Common Issues

1. **Connection Failed**
   - Check `.env` file configuration
   - Verify MongoDB Atlas network access
   - Ensure database user has proper permissions

2. **Setup Script Fails**
   - Run `npm install` first
   - Check Node.js version (v14+)
   - Verify MongoDB connection string

3. **No Data After Setup**
   - Run `npm run db:seed` to add sample data
   - Check database status with `npm run db:status`

### Getting Help

1. Check the logs in the console
2. Run `npm run db:status` for health check
3. Review `DATABASE_SETUP.md` for detailed troubleshooting
4. Verify your MongoDB connection in Atlas dashboard

## 🎯 Next Steps

After successful setup:

1. **Add Sample Data**: `npm run db:seed`
2. **Check Status**: `npm run db:status`
3. **Start Development**: `npm run dev`
4. **Create Backup**: `npm run db:backup`
5. **Explore API**: Visit `http://localhost:5000/api/health`

---

**Happy Farming! 🐔🥚**
