const axios = require('axios');

const API_BASE = 'http://localhost:5000/api';

// Sample data for testing
const sampleData = {
  eggProduction: {
    date: '2024-01-15',
    batchNumber: 'BATCH-001',
    birds: 100,
    eggsCollected: 85,
    damagedEggs: 3,
    notes: 'Normal production day'
  },
  salesOrder: {
    orderNumber: 'ORD-001',
    customerName: 'John Doe',
    customerPhone: '+94 77 123 4567',
    customerEmail: 'john@example.com',
    productType: 'Large Eggs',
    quantity: 50,
    unitPrice: 25,
    orderDate: '2024-01-15',
    deliveryDate: '2024-01-16'
  },
  feedInventory: {
    type: 'Layer Feed',
    quantity: 500,
    supplier: 'AgriSupply Co.',
    lastRestocked: '2024-01-10',
    expiryDate: '2024-06-10',
    costPerUnit: 50
  },
  task: {
    date: '2024-01-16',
    taskDescription: 'Morning Egg Collection',
    category: 'Egg Collection',
    assignedTo: 'Farm Worker 1',
    time: '07:00 AM',
    status: 'Pending'
  },
  financialRecord: {
    date: '2024-01-15',
    description: 'Egg Sales Revenue',
    category: 'Income',
    amount: 1250,
    paymentMethod: 'Cash',
    reference: 'REF-001'
  }
};

async function testAPI() {
  try {
    console.log('🧪 Testing Farm Management API...\n');

    // Test health endpoint
    console.log('1. Testing Health Endpoint...');
    const health = await axios.get(`${API_BASE}/health`);
    console.log('✅ Health:', health.data.message);
    console.log('');

    // Test each module
    const modules = [
      { name: 'Egg Production', endpoint: '/egg-production', data: sampleData.eggProduction },
      { name: 'Sales Orders', endpoint: '/sales-orders', data: sampleData.salesOrder },
      { name: 'Feed Inventory', endpoint: '/feed-inventory', data: sampleData.feedInventory },
      { name: 'Task Scheduling', endpoint: '/task-scheduling', data: sampleData.task },
      { name: 'Financial Records', endpoint: '/financial-records', data: sampleData.financialRecord }
    ];

    for (const module of modules) {
      console.log(`2. Testing ${module.name}...`);
      
      // Create record
      console.log(`   📝 Creating ${module.name} record...`);
      const createResponse = await axios.post(`${API_BASE}${module.endpoint}`, module.data);
      console.log(`   ✅ Created: ${createResponse.data.message}`);
      
      // Get all records
      console.log(`   📋 Fetching ${module.name} records...`);
      const getResponse = await axios.get(`${API_BASE}${module.endpoint}`);
      console.log(`   ✅ Found ${getResponse.data.count} records`);
      
      // Get summary
      console.log(`   📊 Fetching ${module.name} summary...`);
      const summaryResponse = await axios.get(`${API_BASE}${module.endpoint}/summary`);
      console.log(`   ✅ Summary data retrieved`);
      
      console.log('');
    }

    console.log('🎉 All API tests passed successfully!');
    console.log('\n📊 API Summary:');
    console.log('- Health endpoint: ✅ Working');
    console.log('- Create operations: ✅ Working');
    console.log('- Read operations: ✅ Working');
    console.log('- Summary endpoints: ✅ Working');
    console.log('- Database connection: ✅ Connected to MongoDB Atlas');

  } catch (error) {
    console.error('❌ API Test Failed:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
  }
}

// Run the test
testAPI();

