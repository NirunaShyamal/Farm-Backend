const FeedStock = require('../models/FeedStock');
const FeedUsage = require('../models/FeedUsage');
const cron = require('node-cron');

class FeedAutomationService {
  constructor() {
    this.scheduleCronJobs();
  }

  // Schedule all cron jobs
  scheduleCronJobs() {
    // Daily automation at 6:00 AM
    cron.schedule('0 6 * * *', () => {
      console.log('🔄 Running daily feed automation...');
      this.runDailyAutomation();
    });

    // Monthly automation on the 1st at 7:00 AM
    cron.schedule('0 7 1 * *', () => {
      console.log('🔄 Running monthly feed automation...');
      this.runMonthlyAutomation();
    });

    // Weekly report generation on Sunday at 8:00 AM
    cron.schedule('0 8 * * 0', () => {
      console.log('🔄 Generating weekly feed reports...');
      this.generateWeeklyReport();
    });

    console.log('✅ Feed automation cron jobs scheduled');
  }

  // Daily automation tasks
  async runDailyAutomation() {
    try {
      await Promise.all([
        this.updateConsumptionAverages(),
        this.checkLowStockAlerts(),
        this.checkExpiryAlerts(),
        this.updateStockStatus(),
        this.predictStockout()
      ]);
      console.log('✅ Daily feed automation completed');
    } catch (error) {
      console.error('❌ Error in daily automation:', error);
    }
  }

  // Monthly automation tasks
  async runMonthlyAutomation() {
    try {
      await Promise.all([
        this.resetMonthlyBaselines(),
        this.archiveOldRecords(),
        this.generateMonthlyReports(),
        this.optimizeInventoryLevels()
      ]);
      console.log('✅ Monthly feed automation completed');
    } catch (error) {
      console.error('❌ Error in monthly automation:', error);
    }
  }

  // Update consumption averages for all active stocks
  async updateConsumptionAverages() {
    try {
      const currentDate = new Date();
      const currentMonth = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
      
      const activeStocks = await FeedStock.find({ 
        month: currentMonth, 
        status: 'Active' 
      });

      for (const stock of activeStocks) {
        const usageStats = await FeedUsage.getDailyAverages(stock.feedType, currentMonth);
        if (usageStats.length > 0) {
          await stock.updateConsumptionAverage(
            usageStats[0].totalUsage,
            usageStats[0].recordCount
          );
        }
      }

      console.log(`📊 Updated consumption averages for ${activeStocks.length} stocks`);
    } catch (error) {
      console.error('Error updating consumption averages:', error);
    }
  }

  // Check and alert for low stock levels
  async checkLowStockAlerts() {
    try {
      const lowStockItems = await FeedStock.find({ 
        isLowStock: true, 
        status: 'Active' 
      });

      const criticalItems = await FeedStock.find({
        status: 'Active',
        $expr: { $lte: ['$currentQuantity', { $multiply: ['$minimumThreshold', 0.5] }] }
      });

      if (lowStockItems.length > 0 || criticalItems.length > 0) {
        await this.sendStockAlerts(lowStockItems, criticalItems);
      }

      console.log(`🚨 Checked stock alerts: ${lowStockItems.length} low, ${criticalItems.length} critical`);
    } catch (error) {
      console.error('Error checking stock alerts:', error);
    }
  }

  // Check for items nearing expiry
  async checkExpiryAlerts() {
    try {
      const now = new Date();
      const thirtyDaysFromNow = new Date(now.getTime() + (30 * 24 * 60 * 60 * 1000));
      const sevenDaysFromNow = new Date(now.getTime() + (7 * 24 * 60 * 60 * 1000));

      const expiringItems = await FeedStock.find({
        status: 'Active',
        expiryDate: {
          $gte: now.toISOString().split('T')[0],
          $lte: thirtyDaysFromNow.toISOString().split('T')[0]
        }
      });

      const urgentExpiringItems = await FeedStock.find({
        status: 'Active',
        expiryDate: {
          $gte: now.toISOString().split('T')[0],
          $lte: sevenDaysFromNow.toISOString().split('T')[0]
        }
      });

      if (expiringItems.length > 0) {
        await this.sendExpiryAlerts(expiringItems, urgentExpiringItems);
      }

      console.log(`⏰ Checked expiry alerts: ${urgentExpiringItems.length} urgent, ${expiringItems.length} total`);
    } catch (error) {
      console.error('Error checking expiry alerts:', error);
    }
  }

  // Update stock status based on quantity and expiry
  async updateStockStatus() {
    try {
      const now = new Date().toISOString().split('T')[0];

      // Mark depleted stocks
      await FeedStock.updateMany(
        { currentQuantity: { $lte: 0 } },
        { status: 'Depleted' }
      );

      // Mark expired stocks
      await FeedStock.updateMany(
        { expiryDate: { $lt: now } },
        { status: 'Expired' }
      );

      // Reactivate stocks that were depleted but now have quantity
      await FeedStock.updateMany(
        { 
          currentQuantity: { $gt: 0 },
          expiryDate: { $gte: now },
          status: { $in: ['Depleted', 'Expired'] }
        },
        { status: 'Active' }
      );

      console.log('📋 Updated stock statuses based on quantity and expiry');
    } catch (error) {
      console.error('Error updating stock status:', error);
    }
  }

  // Predict stockout dates and send alerts
  async predictStockout() {
    try {
      const activeStocks = await FeedStock.find({ status: 'Active' });
      const stockoutPredictions = [];

      for (const stock of activeStocks) {
        if (stock.averageDailyConsumption > 0) {
          const daysUntilStockout = Math.floor(stock.currentQuantity / stock.averageDailyConsumption);
          
          if (daysUntilStockout <= 14) { // Alert if stockout predicted within 2 weeks
            stockoutPredictions.push({
              feedType: stock.feedType,
              currentQuantity: stock.currentQuantity,
              dailyConsumption: stock.averageDailyConsumption,
              daysUntilStockout,
              predictedStockoutDate: new Date(Date.now() + (daysUntilStockout * 24 * 60 * 60 * 1000))
            });
          }
        }
      }

      if (stockoutPredictions.length > 0) {
        await this.sendStockoutPredictions(stockoutPredictions);
      }

      console.log(`🔮 Generated stockout predictions for ${stockoutPredictions.length} items`);
    } catch (error) {
      console.error('Error predicting stockouts:', error);
    }
  }

  // Reset monthly baselines on first day of month
  async resetMonthlyBaselines() {
    try {
      const currentDate = new Date();
      const currentMonth = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
      
      // This is placeholder - in real implementation, this would be triggered by manual stock updates
      console.log(`📅 Monthly baseline reset initiated for ${currentMonth}`);
    } catch (error) {
      console.error('Error resetting monthly baselines:', error);
    }
  }

  // Archive old records (older than 1 year)
  async archiveOldRecords() {
    try {
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

      const oldUsageRecords = await FeedUsage.find({
        createdAt: { $lt: oneYearAgo }
      });

      const oldStockRecords = await FeedStock.find({
        createdAt: { $lt: oneYearAgo },
        status: { $in: ['Depleted', 'Expired'] }
      });

      // In a real implementation, you might move these to an archive collection
      // For now, we'll just log the counts
      console.log(`📁 Found ${oldUsageRecords.length} old usage records and ${oldStockRecords.length} old stock records for archiving`);
    } catch (error) {
      console.error('Error archiving old records:', error);
    }
  }

  // Generate comprehensive monthly reports
  async generateMonthlyReports() {
    try {
      const currentDate = new Date();
      const lastMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
      const lastMonthStr = `${lastMonth.getFullYear()}-${String(lastMonth.getMonth() + 1).padStart(2, '0')}`;

      // Generate usage summary
      const usageSummary = await FeedUsage.aggregate([
        {
          $match: {
            date: { $regex: `^${lastMonthStr}` }
          }
        },
        {
          $group: {
            _id: '$feedType',
            totalUsage: { $sum: '$quantityUsed' },
            totalCost: { $sum: '$costAnalysis.dailyCost' },
            averageEfficiency: { $avg: { $toDouble: '$feedPerBird' } },
            averageWaste: { $avg: '$wastePercentage' },
            recordCount: { $sum: 1 }
          }
        }
      ]);

      console.log(`📊 Generated monthly report for ${lastMonthStr}: ${usageSummary.length} feed types analyzed`);
    } catch (error) {
      console.error('Error generating monthly reports:', error);
    }
  }

  // Optimize inventory levels based on consumption patterns
  async optimizeInventoryLevels() {
    try {
      const activeStocks = await FeedStock.find({ status: 'Active' });
      const optimizationSuggestions = [];

      for (const stock of activeStocks) {
        if (stock.averageDailyConsumption > 0) {
          const recommendedThreshold = Math.ceil(stock.averageDailyConsumption * 14); // 2 weeks buffer
          const recommendedStock = Math.ceil(stock.averageDailyConsumption * 45); // 45 days stock

          if (stock.minimumThreshold !== recommendedThreshold) {
            optimizationSuggestions.push({
              feedType: stock.feedType,
              currentThreshold: stock.minimumThreshold,
              recommendedThreshold,
              currentBaseline: stock.baselineQuantity,
              recommendedBaseline: recommendedStock,
              reason: 'Based on consumption patterns'
            });
          }
        }
      }

      console.log(`🎯 Generated ${optimizationSuggestions.length} inventory optimization suggestions`);
    } catch (error) {
      console.error('Error optimizing inventory levels:', error);
    }
  }

  // Generate weekly reports
  async generateWeeklyReport() {
    try {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

      const weeklyUsage = await FeedUsage.aggregate([
        {
          $match: {
            createdAt: { $gte: oneWeekAgo }
          }
        },
        {
          $group: {
            _id: '$feedType',
            totalUsage: { $sum: '$quantityUsed' },
            averageDaily: { $avg: '$quantityUsed' },
            efficiency: { $avg: { $toDouble: '$feedPerBird' } }
          }
        }
      ]);

      console.log(`📈 Generated weekly report: ${weeklyUsage.length} feed types analyzed`);
    } catch (error) {
      console.error('Error generating weekly report:', error);
    }
  }

  // Send stock alerts (placeholder - integrate with email/SMS service)
  async sendStockAlerts(lowStockItems, criticalItems) {
    console.log('🚨 STOCK ALERTS:');
    console.log(`Low Stock (${lowStockItems.length}):`, lowStockItems.map(s => `${s.feedType}: ${s.currentQuantity}kg`));
    console.log(`Critical (${criticalItems.length}):`, criticalItems.map(s => `${s.feedType}: ${s.currentQuantity}kg`));
    
    // In production, integrate with:
    // - Email service (SendGrid, AWS SES, etc.)
    // - SMS service (Twilio, etc.)
    // - Push notifications
    // - Slack/Teams webhooks
  }

  // Send expiry alerts
  async sendExpiryAlerts(expiringItems, urgentItems) {
    console.log('⏰ EXPIRY ALERTS:');
    console.log(`Urgent (7 days): ${urgentItems.length} items`);
    console.log(`Warning (30 days): ${expiringItems.length} items`);
  }

  // Send stockout predictions
  async sendStockoutPredictions(predictions) {
    console.log('🔮 STOCKOUT PREDICTIONS:');
    predictions.forEach(p => {
      console.log(`${p.feedType}: ${p.daysUntilStockout} days until stockout (${p.predictedStockoutDate.toDateString()})`);
    });
  }

  // Manual trigger for testing automation
  async runManualAutomation(type = 'daily') {
    console.log(`🔧 Running manual ${type} automation...`);
    if (type === 'daily') {
      await this.runDailyAutomation();
    } else if (type === 'monthly') {
      await this.runMonthlyAutomation();
    }
  }

  // Get automation status and next run times
  getAutomationStatus() {
    return {
      status: 'active',
      scheduledJobs: [
        { name: 'Daily Automation', schedule: '6:00 AM daily', nextRun: this.getNextCronRun('0 6 * * *') },
        { name: 'Monthly Automation', schedule: '7:00 AM on 1st', nextRun: this.getNextCronRun('0 7 1 * *') },
        { name: 'Weekly Reports', schedule: '8:00 AM Sundays', nextRun: this.getNextCronRun('0 8 * * 0') }
      ],
      lastRun: new Date().toISOString()
    };
  }

  // Helper to calculate next cron run time
  getNextCronRun(cronExpression) {
    // This is a simplified calculation - in production use a proper cron parser
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString();
  }
}

module.exports = new FeedAutomationService();
