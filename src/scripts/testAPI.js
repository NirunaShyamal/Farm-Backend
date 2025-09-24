const axios = require('axios');

async function testAPI() {
  try {
    console.log('🧪 Testing Feed Stock API...');
    
    // Test the API endpoint that frontend uses
    const response = await axios.get('http://localhost:5000/api/feed-stock?status=all');
    
    console.log('✅ API Response Status:', response.status);
    console.log('📊 Data Count:', response.data.count);
    console.log('');
    
    if (response.data.success && response.data.data) {
      console.log('📋 Feed Stock Records:');
      response.data.data.forEach((item, index) => {
        console.log(`${index + 1}. ${item.feedType}:`);
        console.log(`   Stock: ${item.currentQuantity} KG`);
        console.log(`   Days Until Expiry: ${item.daysUntilExpiry}`);
        console.log(`   Expiry Date: ${item.expiryDate}`);
        console.log(`   Status: ${item.status}`);
        console.log('');
      });
    } else {
      console.log('❌ No data in response');
    }
    
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.log('❌ Server is not running on http://localhost:5000');
      console.log('   Please start the server first with: node server.js');
    } else {
      console.log('❌ Error:', error.message);
    }
  }
}

testAPI();
