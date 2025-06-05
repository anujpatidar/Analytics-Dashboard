const { google } = require('googleapis');
const readline = require('readline');
const fs = require('fs');
const path = require('path');

// Color codes for better console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

class GoogleAdsTokenGenerator {
  constructor() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
  }

  log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
  }

  async prompt(question) {
    return new Promise((resolve) => {
      this.rl.question(question, resolve);
    });
  }

  async getCredentials() {
    this.log('\n🚀 Google Ads API Token Generator', 'cyan');
    this.log('=====================================', 'cyan');
    
    this.log('\n📋 Please provide your OAuth2 credentials:', 'yellow');
    this.log('(You can get these from Google Cloud Console > APIs & Services > Credentials)', 'bright');
    
    const clientId = await this.prompt('\n🔑 Enter your OAuth2 Client ID: ');
    const clientSecret = await this.prompt('🔐 Enter your OAuth2 Client Secret: ');
    const developerToken = await this.prompt('🎯 Enter your Google Ads Developer Token: ');
    const customerId = await this.prompt('👤 Enter your Google Ads Customer ID (numbers only, no dashes): ');

    return { clientId, clientSecret, developerToken, customerId };
  }

  async generateRefreshToken(clientId, clientSecret) {
    // For Desktop applications, use out-of-band (oob) flow
    const oauth2Client = new google.auth.OAuth2(
      clientId,
      clientSecret,
      'urn:ietf:wg:oauth:2.0:oob'
    );

    const scopes = ['https://www.googleapis.com/auth/adwords'];
    
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      response_type: 'code',
      prompt: 'consent',
      include_granted_scopes: true
    });

    this.log('\n🌐 Authorization Required', 'magenta');
    this.log('========================', 'magenta');
    this.log('\n1. Open the following URL in your browser:', 'yellow');
    this.log(`\n${authUrl}`, 'blue');
    this.log('\n2. Sign in with your Google account that has access to Google Ads', 'yellow');
    this.log('3. Click "Continue" on the verification warning (this is normal for testing)', 'yellow');
    this.log('4. Grant permissions to your application', 'yellow');
    this.log('5. Copy the authorization code shown on the page', 'yellow');
    this.log('   (It will be displayed directly on the page, not in a URL)', 'bright');

    const code = await this.prompt('\n📝 Enter the authorization code: ');

    try {
      this.log('\n⏳ Exchanging code for tokens...', 'yellow');
      const { tokens } = await oauth2Client.getToken(code);
      
      if (!tokens.refresh_token) {
        throw new Error('No refresh token received. Please ensure you granted offline access.');
      }

      this.log('\n✅ Success! Tokens generated:', 'green');
      return tokens;
    } catch (error) {
      this.log(`\n❌ Error generating tokens: ${error.message}`, 'red');
      
      // Provide helpful troubleshooting
      this.log('\n🔧 Troubleshooting tips:', 'yellow');
      this.log('1. Make sure you created a "Desktop Application" OAuth2 client', 'bright');
      this.log('2. Ensure you clicked "Continue" on the verification warning', 'bright');
      this.log('3. Copy the entire authorization code from the page', 'bright');
      this.log('4. Make sure you granted all requested permissions', 'bright');
      
      throw error;
    }
  }

  async saveToEnvFile(credentials, tokens) {
    const envPath = path.join(__dirname, '../.env');
    const envContent = `
# Google Ads API Configuration
GOOGLE_ADS_CLIENT_ID=${credentials.clientId}
GOOGLE_ADS_CLIENT_SECRET=${credentials.clientSecret}
GOOGLE_ADS_REFRESH_TOKEN=${tokens.refresh_token}
GOOGLE_ADS_DEVELOPER_TOKEN=${credentials.developerToken}
GOOGLE_ADS_CUSTOMER_ID=${credentials.customerId}

# Access Token (for reference, will be auto-refreshed)
GOOGLE_ADS_ACCESS_TOKEN=${tokens.access_token}
`;

    try {
      // Check if .env file exists and ask before overwriting
      if (fs.existsSync(envPath)) {
        const overwrite = await this.prompt('\n📁 .env file already exists. Append Google Ads config? (y/n): ');
        if (overwrite.toLowerCase() === 'y' || overwrite.toLowerCase() === 'yes') {
          fs.appendFileSync(envPath, envContent);
          this.log('\n✅ Google Ads configuration appended to .env file', 'green');
        } else {
          this.log('\n📋 Environment variables (copy these to your .env file):', 'yellow');
          this.log(envContent, 'cyan');
        }
      } else {
        fs.writeFileSync(envPath, envContent);
        this.log('\n✅ .env file created with Google Ads configuration', 'green');
      }
    } catch (error) {
      this.log(`\n⚠️  Could not write to .env file: ${error.message}`, 'yellow');
      this.log('\n📋 Please manually add these to your .env file:', 'yellow');
      this.log(envContent, 'cyan');
    }
  }

  async testConnection(credentials, tokens) {
    this.log('\n🧪 Testing API connection...', 'yellow');
    
    try {
      const { GoogleAdsApi } = require('google-ads-api');
      
      const client = new GoogleAdsApi({
        client_id: credentials.clientId,
        client_secret: credentials.clientSecret,
        developer_token: credentials.developerToken,
      });

      const customer = client.Customer({
        customer_id: credentials.customerId,
        refresh_token: tokens.refresh_token,
      });

      // Simple test query
      const query = `
        SELECT 
          customer.id,
          customer.descriptive_name,
          customer.currency_code,
          customer.time_zone
        FROM customer
        LIMIT 1
      `;

      const response = await customer.query(query);
      
      if (response && response.length > 0) {
        const customerInfo = response[0].customer;
        this.log('\n🎉 Connection successful!', 'green');
        this.log(`Customer ID: ${customerInfo.id.value}`, 'cyan');
        this.log(`Account Name: ${customerInfo.descriptive_name.value}`, 'cyan');
        this.log(`Currency: ${customerInfo.currency_code.value}`, 'cyan');
        this.log(`Timezone: ${customerInfo.time_zone.value}`, 'cyan');
      } else {
        this.log('\n⚠️  Connection test completed but no data returned', 'yellow');
      }
    } catch (error) {
      this.log(`\n❌ Connection test failed: ${error.message}`, 'red');
      this.log('\nThis might be due to:', 'yellow');
      this.log('- Developer token not approved yet', 'yellow');
      this.log('- Incorrect customer ID', 'yellow');
      this.log('- Account access permissions', 'yellow');
      this.log('\nYou can still proceed with the integration setup.', 'yellow');
    }
  }

  async run() {
    try {
      const credentials = await this.getCredentials();
      
      this.log('\n🔄 Starting OAuth2 flow...', 'yellow');
      const tokens = await this.generateRefreshToken(credentials.clientId, credentials.clientSecret);
      
      await this.saveToEnvFile(credentials, tokens);
      
      // Test the connection
      await this.testConnection(credentials, tokens);
      
      this.log('\n🎯 Setup Complete!', 'green');
      this.log('================', 'green');
      this.log('\nNext steps:', 'yellow');
      this.log('1. Restart your server: npm run dev', 'cyan');
      this.log('2. Check the Google Ads dashboard widget', 'cyan');
      this.log('3. Visit /google-ads for detailed analytics', 'cyan');
      
      if (tokens.refresh_token) {
        this.log('\n💡 Important Notes:', 'magenta');
        this.log('- Your refresh token is saved and will be used to auto-refresh access tokens', 'bright');
        this.log('- Keep your .env file secure and never commit it to version control', 'bright');
        this.log('- If you get "Developer token not approved" errors, apply for Standard access in Google Ads', 'bright');
      }

    } catch (error) {
      this.log(`\n💥 Setup failed: ${error.message}`, 'red');
      this.log('\nPlease check your credentials and try again.', 'yellow');
    } finally {
      this.rl.close();
    }
  }
}

// Run the generator
if (require.main === module) {
  const generator = new GoogleAdsTokenGenerator();
  generator.run().catch(console.error);
}

module.exports = GoogleAdsTokenGenerator; 