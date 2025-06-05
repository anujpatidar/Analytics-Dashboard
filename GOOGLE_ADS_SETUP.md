# Google Ads Analytics Integration

This document explains how to set up and use the Google Ads analytics integration in your dashboard.

## Features

- **Account Summary**: View overall Google Ads performance metrics
- **Campaign Insights**: Detailed campaign-level analytics with ROAS tracking
- **Keywords Analytics**: Top performing keywords with match types and costs
- **Real-time Data**: Fetch live data from Google Ads API
- **Date Range Filtering**: Analyze data for specific time periods
- **Export Functionality**: Export campaign and keyword data to CSV
- **Dashboard Widget**: Quick overview on the main dashboard
- **Dedicated Page**: Comprehensive analytics with charts, tables, and tabs
- **Interactive Charts**: Visual analytics for campaigns by cost, ROAS, and conversions

## Setup Instructions

### 1. Google Ads API Setup

1. **Create a Google Cloud Project**:
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select an existing one
   - Enable the Google Ads API

2. **Create OAuth2 Credentials**:
   - Go to APIs & Services > Credentials
   - Click "Create Credentials" > "OAuth client ID"
   - Choose "Desktop application"
   - Note down your Client ID and Client Secret

3. **Get Developer Token**:
   - Apply for a Developer Token in your Google Ads account
   - Go to Tools & Settings > Setup > API Center
   - Apply for Basic or Standard access (you mentioned you have a test token)

4. **Generate Refresh Token**:
   - Use Google OAuth2 Playground or run a script to get refresh token
   - Authorize with scopes: `https://www.googleapis.com/auth/adwords`

5. **Find Your Customer ID**:
   - Go to Google Ads account
   - Customer ID is displayed in the top-right (format: 123-456-7890)
   - Remove dashes for API use (1234567890)

### 2. Environment Configuration

Create a `.env` file in the `server` directory with the following variables:

```env
# Google Ads Configuration
GOOGLE_ADS_CLIENT_ID=your_oauth2_client_id
GOOGLE_ADS_CLIENT_SECRET=your_oauth2_client_secret
GOOGLE_ADS_REFRESH_TOKEN=your_refresh_token
GOOGLE_ADS_DEVELOPER_TOKEN=your_developer_token
GOOGLE_ADS_CUSTOMER_ID=1234567890
```

### 3. Install Dependencies

```bash
# Install server dependencies
cd server
npm install google-ads-api

# Install client dependencies (if not already installed)
cd ..
npm install react-chartjs-2 chart.js react-icons
```

### 4. Start the Application

```bash
# Start the server
cd server
npm run dev

# Start the client (in another terminal)
cd ..
npm start
```

## API Endpoints

### Get Account Summary
```
GET /api/v1/google-ads/summary?dateRange=last_30_days
```

### Get Campaign Insights
```
GET /api/v1/google-ads/campaigns?dateRange=last_30_days
```

### Get Keywords Insights
```
GET /api/v1/google-ads/keywords?dateRange=last_30_days&limit=50
```

### Export to CSV
```
POST /api/v1/google-ads/export-csv
Content-Type: application/json

{
  "dateRange": "last_30_days",
  "filename": "google_ads_export.csv"
}
```

### Custom Date Range
```
GET /api/v1/google-ads/summary?since=2024-01-01&until=2024-01-31
```

## Available Metrics

- **Cost**: Total amount spent on ads (in rupees)
- **Impressions**: Number of times ads were shown
- **Clicks**: Number of clicks on ads
- **CTR**: Click-through rate (%)
- **CPC**: Cost per click (average)
- **CPM**: Cost per thousand impressions
- **Conversions**: Number of conversions
- **Conversion Value**: Total value of conversions
- **ROAS**: Return on ad spend (conversion value / cost)
- **Conversion Rate**: Conversions / Clicks (%)
- **Cost per Conversion**: Average cost per conversion
- **Keywords**: Individual keyword performance with match types

## Date Range Options

- `today`: Current day
- `yesterday`: Previous day
- `last_7_days`: Last 7 days
- `last_30_days`: Last 30 days (default)
- `this_month`: Current month
- Custom range: Specify `since` and `until` dates (YYYY-MM-DD)

## Usage Examples

### Dashboard Widget
The Google Ads widget appears on the main dashboard showing:
- Key metrics for the last 7 days
- Top 5 campaigns by cost
- Quick access to detailed analytics

### Dedicated Analytics Page
Navigate to `/google-ads` for comprehensive analytics including:
- Multiple tabs: Campaigns, Keywords, Charts
- Detailed metrics with date range selection
- Interactive charts for campaign performance
- Campaign and keyword comparison tables
- Export functionality

### Programmatic Access
```javascript
import * as googleAdsAPI from './api/googleAdsAPI';

// Get summary data
const summary = await googleAdsAPI.getSummary({
  dateRange: 'last_30_days'
});

// Get campaign data with custom date range
const campaigns = await googleAdsAPI.getCampaigns({
  since: '2024-01-01',
  until: '2024-01-31'
});

// Get keywords data
const keywords = await googleAdsAPI.getKeywords({
  dateRange: 'last_7_days',
  limit: 20
});

// Export data
await googleAdsAPI.exportToCsv({
  dateRange: 'last_7_days',
  filename: 'weekly_report.csv'
});
```

## Google Ads API Query Structure

The integration uses Google Ads Query Language (GAQL) to fetch data:

```sql
-- Account Performance
SELECT 
  metrics.impressions,
  metrics.clicks,
  metrics.cost_micros,
  metrics.conversions,
  metrics.conversions_value
FROM account_performance_report 
WHERE segments.date BETWEEN '2024-01-01' AND '2024-01-31'

-- Campaign Performance  
SELECT 
  campaign.id,
  campaign.name,
  metrics.impressions,
  metrics.clicks,
  metrics.cost_micros
FROM campaign_performance_report 
WHERE segments.date BETWEEN '2024-01-01' AND '2024-01-31'

-- Keywords Performance
SELECT 
  ad_group_criterion.keyword.text,
  ad_group_criterion.keyword.match_type,
  metrics.impressions,
  metrics.clicks,
  metrics.cost_micros
FROM keyword_view 
WHERE segments.date BETWEEN '2024-01-01' AND '2024-01-31'
```

## Troubleshooting

### Common Issues

1. **Authentication Error**:
   - Verify OAuth2 credentials are correct
   - Check if refresh token is valid and not expired
   - Ensure developer token has proper access level

2. **Customer ID Not Found**:
   - Verify customer ID format (numbers only, no dashes)
   - Ensure you have access to the account
   - Check if account is properly linked to your developer token

3. **API Quota Exceeded**:
   - Google Ads API has rate limits
   - Implement retry logic with exponential backoff
   - Consider caching frequently accessed data

4. **No Data Returned**:
   - Check if the account has campaigns in the specified date range
   - Verify date format (YYYY-MM-DD)
   - Ensure account has sufficient permissions

5. **Permission Denied**:
   - Check if developer token is approved
   - Verify OAuth2 scopes include `https://www.googleapis.com/auth/adwords`
   - Ensure account has proper access levels

### Debug Mode

Set `NODE_ENV=development` to see detailed API logs in the server console.

### Getting Refresh Token

Use this Node.js script to generate a refresh token:

```javascript
const { google } = require('googleapis');

const oauth2Client = new google.auth.OAuth2(
  'your_client_id',
  'your_client_secret',
  'urn:ietf:wg:oauth:2.0:oob'
);

const authUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  scope: ['https://www.googleapis.com/auth/adwords'],
});

console.log('Authorize this app by visiting this url:', authUrl);
// Follow the URL, get the code, then:

// oauth2Client.getToken(code, (err, token) => {
//   console.log('Refresh token:', token.refresh_token);
// });
```

## Security Notes

- Never commit OAuth2 credentials to version control
- Use environment variables for all sensitive data
- Regularly rotate refresh tokens
- Monitor API usage and costs
- Implement proper error handling and logging

## Performance Considerations

- Data is fetched in real-time from Google Ads API
- API has rate limits (be mindful of concurrent requests)
- Large date ranges may take longer to process
- Consider implementing caching for frequently accessed data
- The dashboard widget uses a 7-day range for optimal performance
- Keywords are limited to top 50 by default to reduce response time

## Google Ads vs Meta Ads

Key differences in metrics:
- **Cost** (Google) vs **Spend** (Meta)
- **Conversions** vs **Purchases**
- **Cost micros** (Google uses micros, divide by 1,000,000)
- **Keywords insights** (Google-specific feature)
- **Match types** for keywords (Exact, Broad, Phrase)

## Support

For issues related to:
- Google Ads API: Check [Google Ads API documentation](https://developers.google.com/google-ads/api/docs/start)
- Integration bugs: Check the server logs and browser console
- Feature requests: Create an issue in the project repository
- OAuth2 setup: Refer to [Google OAuth2 documentation](https://developers.google.com/identity/protocols/oauth2) 