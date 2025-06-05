# Meta Ads Analytics Integration

This document explains how to set up and use the Meta Ads analytics integration in your dashboard.

## Features

- **Account Summary**: View overall Meta Ads performance metrics
- **Campaign Insights**: Detailed campaign-level analytics
- **Real-time Data**: Fetch live data from Meta Ads API
- **Date Range Filtering**: Analyze data for specific time periods
- **Export Functionality**: Export campaign data to CSV
- **Dashboard Widget**: Quick overview on the main dashboard
- **Dedicated Page**: Comprehensive analytics with charts and tables

## Setup Instructions

### 1. Meta Ads API Setup

1. **Create a Meta App**:
   - Go to [Meta for Developers](https://developers.facebook.com/)
   - Create a new app and select "Business" type
   - Note down your App ID and App Secret

2. **Get Access Token**:
   - Go to Graph API Explorer
   - Select your app and generate a User Access Token
   - Grant necessary permissions: `ads_read`, `ads_management`
   - Exchange for a long-lived token (recommended)

3. **Find Your Ad Account ID**:
   - Go to Meta Ads Manager
   - Your Ad Account ID is in the URL or account settings
   - Format: `act_1234567890`

### 2. Environment Configuration

Create a `.env` file in the `server` directory with the following variables:

```env
# Meta Ads Configuration
META_ACCESS_TOKEN=your_long_lived_access_token
META_APP_ID=your_app_id
META_APP_SECRET=your_app_secret
META_AD_ACCOUNT_ID=act_your_ad_account_id
```

### 3. Install Dependencies

```bash
# Install server dependencies
cd server
npm install facebook-nodejs-business-sdk

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
GET /api/v1/meta-ads/summary?dateRange=last_30_days
```

### Get Campaign Insights
```
GET /api/v1/meta-ads/campaigns?dateRange=last_30_days
```

### Export to CSV
```
POST /api/v1/meta-ads/export-csv
Content-Type: application/json

{
  "dateRange": "last_30_days",
  "filename": "meta_ads_export.csv"
}
```

### Custom Date Range
```
GET /api/v1/meta-ads/summary?since=2024-01-01&until=2024-01-31
```

## Available Metrics

- **Spend**: Total amount spent on ads
- **Impressions**: Number of times ads were shown
- **Clicks**: Number of clicks on ads
- **CTR**: Click-through rate (%)
- **CPC**: Cost per click
- **CPM**: Cost per thousand impressions
- **Reach**: Number of unique people reached
- **Frequency**: Average number of times each person saw the ad
- **Purchases**: Number of purchase conversions
- **ROAS**: Return on ad spend
- **Purchase Value**: Total value of purchases

## Date Range Options

- `today`: Current day
- `yesterday`: Previous day
- `last_7_days`: Last 7 days
- `last_30_days`: Last 30 days (default)
- `this_month`: Current month
- Custom range: Specify `since` and `until` dates (YYYY-MM-DD)

## Usage Examples

### Dashboard Widget
The Meta Ads widget appears on the main dashboard showing:
- Key metrics for the last 7 days
- Top 5 campaigns by spend
- Quick access to detailed analytics

### Dedicated Analytics Page
Navigate to `/meta-ads` for comprehensive analytics including:
- Detailed metrics with date range selection
- Interactive charts for campaign performance
- Campaign comparison table
- Export functionality

### Programmatic Access
```javascript
import * as metaAdsAPI from './api/metaAdsAPI';

// Get summary data
const summary = await metaAdsAPI.getSummary({
  dateRange: 'last_30_days'
});

// Get campaign data with custom date range
const campaigns = await metaAdsAPI.getCampaigns({
  since: '2024-01-01',
  until: '2024-01-31'
});

// Export data
await metaAdsAPI.exportToCsv({
  dateRange: 'last_7_days',
  filename: 'weekly_report.csv'
});
```

## Troubleshooting

### Common Issues

1. **Access Token Expired**:
   - Generate a new long-lived access token
   - Update the `META_ACCESS_TOKEN` environment variable

2. **Permission Denied**:
   - Ensure your app has the necessary permissions
   - Check that you have access to the ad account

3. **Rate Limiting**:
   - Meta has API rate limits
   - The app includes basic error handling for rate limits

4. **No Data Returned**:
   - Check if the ad account has campaigns in the specified date range
   - Verify the ad account ID format (should start with `act_`)

### Debug Mode

Set `NODE_ENV=development` to see detailed API logs in the server console.

## Security Notes

- Never commit access tokens to version control
- Use environment variables for all sensitive data
- Consider implementing token refresh logic for production
- Regularly rotate access tokens

## Performance Considerations

- Data is fetched in real-time from Meta's API
- Consider implementing caching for frequently accessed data
- Large date ranges may take longer to process
- The dashboard widget uses a 7-day range for optimal performance

## Support

For issues related to:
- Meta Ads API: Check [Meta for Developers documentation](https://developers.facebook.com/docs/marketing-api/)
- Integration bugs: Check the server logs and browser console
- Feature requests: Create an issue in the project repository 