const { GoogleAdsApi } = require('google-ads-api');
require('dotenv').config();

async function testGoogleAdsConnection() {
    console.log('🔧 Testing Google Ads API Connection...\n');
    
    // Check environment variables
    console.log('📋 Configuration:');
    console.log(`Client ID: ${process.env.GOOGLE_ADS_CLIENT_ID ? '✅ Set' : '❌ Missing'}`);
    console.log(`Client Secret: ${process.env.GOOGLE_ADS_CLIENT_SECRET ? '✅ Set' : '❌ Missing'}`);
    console.log(`Refresh Token: ${process.env.GOOGLE_ADS_REFRESH_TOKEN ? '✅ Set' : '❌ Missing'}`);
    console.log(`Developer Token: ${process.env.GOOGLE_ADS_DEVELOPER_TOKEN ? '✅ Set' : '❌ Missing'}`);
    console.log(`Customer ID: ${process.env.GOOGLE_ADS_CUSTOMER_ID ? '✅ Set' : '❌ Missing'}`);
    console.log('');

    try {
        // Initialize the client
        const client = new GoogleAdsApi({
            client_id: process.env.GOOGLE_ADS_CLIENT_ID,
            client_secret: process.env.GOOGLE_ADS_CLIENT_SECRET,
            developer_token: process.env.GOOGLE_ADS_DEVELOPER_TOKEN,
        });

        const customer = client.Customer({
            customer_id: process.env.GOOGLE_ADS_CUSTOMER_ID,
            refresh_token: process.env.GOOGLE_ADS_REFRESH_TOKEN,
        });

        console.log('🧪 Testing basic customer query...');
        
        // Test 1: Simple customer query
        const customerQuery = `
            SELECT 
                customer.id,
                customer.descriptive_name,
                customer.currency_code,
                customer.time_zone
            FROM customer
            LIMIT 1
        `;

        const customerResponse = await customer.query(customerQuery);
        
        if (customerResponse && customerResponse.length > 0) {
            const customerInfo = customerResponse[0].customer;
            console.log('✅ Customer query successful!');
            console.log(`   Customer ID: ${customerInfo.id?.value}`);
            console.log(`   Account Name: ${customerInfo.descriptive_name?.value}`);
            console.log(`   Currency: ${customerInfo.currency_code?.value}`);
            console.log(`   Timezone: ${customerInfo.time_zone?.value}`);
        } else {
            console.log('⚠️  Customer query returned no data');
        }

        console.log('\n🧪 Testing campaign query...');
        
        // Test 2: Simple campaign query
        const campaignQuery = `
            SELECT 
                campaign.id,
                campaign.name,
                campaign.status
            FROM campaign
            WHERE campaign.status != 'REMOVED'
            LIMIT 5
        `;

        const campaignResponse = await customer.query(campaignQuery);
        
        if (campaignResponse && campaignResponse.length > 0) {
            console.log('✅ Campaign query successful!');
            campaignResponse.forEach((row, index) => {
                console.log(`   Campaign ${index + 1}: ${row.campaign?.name?.value} (ID: ${row.campaign?.id?.value})`);
            });
        } else {
            console.log('⚠️  No campaigns found or campaign query failed');
        }

        console.log('\n🎉 Connection test completed successfully!');
        console.log('\n💡 If you see this message, your tokens are working correctly.');
        console.log('   The GRPC error might be due to:');
        console.log('   1. Developer token restrictions (test tokens have limited access)');
        console.log('   2. Network/firewall issues');
        console.log('   3. API version compatibility');

    } catch (error) {
        console.error('\n❌ Connection test failed:');
        console.error(`Error: ${error.message}`);
        console.error(`Code: ${error.code}`);
        
        if (error.message.includes('GRPC target method')) {
            console.log('\n🔧 Troubleshooting GRPC error:');
            console.log('1. Your developer token might be a test token with limited access');
            console.log('2. Try applying for Standard access in Google Ads > Tools & Settings > API Center');
            console.log('3. Ensure your account has active campaigns');
            console.log('4. Check if your Google Ads account is properly set up');
        }

        if (error.message.includes('INVALID_CUSTOMER_ID')) {
            console.log('\n🔧 Customer ID issue:');
            console.log('1. Verify the Customer ID format (numbers only, no dashes)');
            console.log('2. Make sure the Customer ID belongs to the same account as your developer token');
        }

        if (error.message.includes('authentication')) {
            console.log('\n🔧 Authentication issue:');
            console.log('1. Refresh token might be expired');
            console.log('2. Re-run the token generator: npm run setup-google-ads');
        }
    }
}

// Run the test
testGoogleAdsConnection().catch(console.error); 