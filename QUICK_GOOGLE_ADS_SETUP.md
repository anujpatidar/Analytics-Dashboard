# 🚀 Quick Google Ads Setup

This guide will get you up and running with Google Ads integration in just a few minutes!

## Prerequisites

Before running the token generator, you need:

1. **Google Cloud Console Setup**:
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select existing one
   - Enable the Google Ads API
   - Create OAuth2 credentials (**Desktop Application** - not Web Application)
   - Add `http://localhost:8080` to authorized redirect URIs

2. **Google Ads Account**:
   - Your test developer token
   - Customer ID (format: 123-456-7890, but use 1234567890 for API)

## 🏃‍♂️ Quick Setup (3 Steps)

### Step 1: Get Your Credentials Ready

Gather these 4 pieces of information:
- **OAuth2 Client ID** (from Google Cloud Console)
- **OAuth2 Client Secret** (from Google Cloud Console)
- **Developer Token** (you mentioned you have a test one)
- **Customer ID** (from Google Ads account, numbers only)

### Step 2: Run the Token Generator

```bash
cd server
npm run setup-google-ads
```

The script will:
- ✅ Guide you through entering credentials
- ✅ Generate the authorization URL
- ✅ Exchange authorization code for refresh token
- ✅ Save configuration to .env file
- ✅ Test the API connection
- ✅ Display your account information

### Step 3: Start the Dashboard

```bash
npm run dev
```

Visit `http://localhost:8080` and check the Google Ads widget on the dashboard!

## 📱 What the Script Does

The interactive script will:

1. **Collect Credentials**: Prompts you for OAuth2 client ID, secret, developer token, and customer ID
2. **Generate Auth URL**: Creates a personalized Google OAuth URL
3. **Handle Authorization**: Walks you through the browser authorization flow
4. **Exchange Tokens**: Converts the authorization code to refresh token
5. **Save Configuration**: Automatically adds to your `.env` file
6. **Test Connection**: Verifies everything works and shows account info

## 🎯 Sample Output

```
🚀 Google Ads API Token Generator
=====================================

📋 Please provide your OAuth2 credentials:
🔑 Enter your OAuth2 Client ID: 12345...apps.googleusercontent.com
🔐 Enter your OAuth2 Client Secret: abc123...
🎯 Enter your Google Ads Developer Token: xyz789...
👤 Enter your Google Ads Customer ID: 1234567890

🌐 Authorization Required
========================
1. Open the following URL in your browser:
https://accounts.google.com/o/oauth2/auth?...

📝 Enter the authorization code: 4/abc123...

✅ Success! Tokens generated
✅ Google Ads configuration appended to .env file

🧪 Testing API connection...
🎉 Connection successful!
Customer ID: 123-456-7890
Account Name: Your Account Name
Currency: USD
Timezone: America/New_York

🎯 Setup Complete!
```

## 🔧 Manual Setup (If Script Fails)

If you prefer manual setup or the script fails, add this to your `.env` file:

```env
# Google Ads API Configuration
GOOGLE_ADS_CLIENT_ID=your_oauth2_client_id
GOOGLE_ADS_CLIENT_SECRET=your_oauth2_client_secret
GOOGLE_ADS_REFRESH_TOKEN=your_refresh_token
GOOGLE_ADS_DEVELOPER_TOKEN=your_developer_token
GOOGLE_ADS_CUSTOMER_ID=1234567890
```

## 🆘 Troubleshooting

### "Required parameter is missing: response_type" (FIXED)
- This has been fixed in the latest version of the token generator
- The script now properly includes all required OAuth2 parameters
- Uses both standard and fallback authorization methods

### OAuth2 Redirect URI Mismatch
- Add `http://localhost:8080` to your authorized redirect URIs in Google Cloud Console
- Go to APIs & Services > Credentials > Your OAuth2 Client > Authorized redirect URIs

### "No refresh token received"
- Make sure you use OAuth2 Desktop Application (not Web Application)
- The script now includes automatic fallback methods
- Look for the alternative URL if the first method fails

### "Developer token not approved"
- Your test token might be limited to test accounts
- Apply for Standard access in Google Ads > Tools & Settings > API Center

### "Customer not found"
- Remove dashes from Customer ID (use 1234567890, not 123-456-7890)
- Ensure the account is linked to your developer token

### "Permission denied"
- Verify the Google account has access to the Google Ads account
- Check that OAuth2 scopes include `https://www.googleapis.com/auth/adwords`

## 🎉 What's Next?

After setup:
1. **Dashboard Widget**: Check the Google Ads widget on your main dashboard
2. **Full Analytics**: Visit `/google-ads` for detailed campaign and keyword analytics
3. **Export Data**: Use the export functionality to download campaign data
4. **Custom Queries**: Modify the analytics class for custom reporting needs

## 📞 Support

- If you encounter issues, check the server console for detailed error messages
- The script includes comprehensive error handling and troubleshooting tips
- All tokens are saved securely and refresh automatically 