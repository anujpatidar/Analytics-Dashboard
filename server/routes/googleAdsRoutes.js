const express = require('express');
const router = express.Router();
const GoogleAdsAnalytics = require('../utils/GoogleAdsAnalytics');

// Initialize Google Ads Analytics (you should move these to environment variables)
const initializeGoogleAds = () => {
    const clientId = process.env.GOOGLE_ADS_CLIENT_ID || 'your_client_id';
    const clientSecret = process.env.GOOGLE_ADS_CLIENT_SECRET || 'your_client_secret';
    const refreshToken = process.env.GOOGLE_ADS_REFRESH_TOKEN || 'your_refresh_token';
    const developerToken = process.env.GOOGLE_ADS_DEVELOPER_TOKEN || 'your_developer_token';
    const customerId = process.env.GOOGLE_ADS_CUSTOMER_ID || 'your_customer_id';

    return new GoogleAdsAnalytics(clientId, clientSecret, refreshToken, developerToken, customerId);
};

// Get account summary
router.get('/summary', async (req, res) => {
    try {
        const { dateRange } = req.query;
        const analytics = initializeGoogleAds();
        
        let parsedDateRange = dateRange || 'last_30_days';
        
        // Handle custom date range
        if (req.query.since && req.query.until) {
            parsedDateRange = {
                since: req.query.since,
                until: req.query.until
            };
        }

        const summary = await analytics.getAccountSummary(parsedDateRange);
        
        if (!summary) {
            return res.status(404).json({ message: 'No data found for the specified date range' });
        }

        res.json({
            success: true,
            data: summary
        });
    } catch (error) {
        console.error('Error fetching Google Ads summary:', error);
        
        // Handle developer token limitation
        if (error.message.includes('DEVELOPER_TOKEN_NOT_APPROVED')) {
            return res.status(200).json({
                success: true,
                data: {
                    impressions: 0,
                    clicks: 0,
                    cost: 0,
                    conversions: 0,
                    conversion_value: 0,
                    ctr: 0,
                    cpc: 0,
                    cpm: 0,
                    cost_per_conversion: 0,
                    roas: 0,
                    conversion_rate: 0,
                    date_range: { since: '2025-06-05', until: '2025-06-05' }
                },
                message: 'Test developer token detected. Apply for Standard access in Google Ads to view real data.',
                tokenStatus: 'TEST_TOKEN'
            });
        }
        
        res.status(500).json({
            success: false,
            message: 'Failed to fetch Google Ads summary',
            error: error.message
        });
    }
});

// Get campaign insights
router.get('/campaigns', async (req, res) => {
    try {
        const { dateRange, campaignIds } = req.query;
        const analytics = initializeGoogleAds();
        
        let parsedDateRange = dateRange || 'last_30_days';
        let parsedCampaignIds = null;
        
        // Handle custom date range
        if (req.query.since && req.query.until) {
            parsedDateRange = {
                since: req.query.since,
                until: req.query.until
            };
        }

        // Handle campaign IDs filter
        if (campaignIds) {
            parsedCampaignIds = Array.isArray(campaignIds) ? campaignIds : [campaignIds];
        }

        const campaigns = await analytics.getCampaignInsights(parsedDateRange, parsedCampaignIds);

        res.json({
            success: true,
            data: campaigns,
            count: campaigns.length
        });
    } catch (error) {
        console.error('Error fetching Google Ads campaigns:', error);
        
        // Handle developer token limitation
        if (error.message.includes('DEVELOPER_TOKEN_NOT_APPROVED')) {
            return res.status(200).json({
                success: true,
                data: [],
                count: 0,
                message: 'Test developer token detected. Apply for Standard access in Google Ads to view campaign data.',
                tokenStatus: 'TEST_TOKEN'
            });
        }
        
        res.status(500).json({
            success: false,
            message: 'Failed to fetch Google Ads campaigns',
            error: error.message
        });
    }
});

// Get keywords insights
router.get('/keywords', async (req, res) => {
    try {
        const { dateRange, limit } = req.query;
        const analytics = initializeGoogleAds();
        
        let parsedDateRange = dateRange || 'last_30_days';
        const parsedLimit = limit ? parseInt(limit) : 50;
        
        // Handle custom date range
        if (req.query.since && req.query.until) {
            parsedDateRange = {
                since: req.query.since,
                until: req.query.until
            };
        }

        const keywords = await analytics.getKeywords(parsedDateRange, parsedLimit);

        res.json({
            success: true,
            data: keywords,
            count: keywords.length
        });
    } catch (error) {
        console.error('Error fetching Google Ads keywords:', error);
        
        // Handle developer token limitation
        if (error.message.includes('DEVELOPER_TOKEN_NOT_APPROVED')) {
            return res.status(200).json({
                success: true,
                data: [],
                count: 0,
                message: 'Test developer token detected. Apply for Standard access in Google Ads to view keyword data.',
                tokenStatus: 'TEST_TOKEN'
            });
        }
        
        res.status(500).json({
            success: false,
            message: 'Failed to fetch Google Ads keywords',
            error: error.message
        });
    }
});

// Export campaigns to CSV
router.post('/export-csv', async (req, res) => {
    try {
        const { dateRange, campaignIds, filename } = req.body;
        const analytics = initializeGoogleAds();
        
        let parsedDateRange = dateRange || 'last_30_days';
        let parsedCampaignIds = null;
        
        // Handle custom date range
        if (req.body.since && req.body.until) {
            parsedDateRange = {
                since: req.body.since,
                until: req.body.until
            };
        }

        // Handle campaign IDs filter
        if (campaignIds) {
            parsedCampaignIds = Array.isArray(campaignIds) ? campaignIds : [campaignIds];
        }

        const campaigns = await analytics.getCampaignInsights(parsedDateRange, parsedCampaignIds);
        
        const csvFilename = filename || `google_ads_campaigns_${Date.now()}.csv`;
        await analytics.exportToCSV(campaigns, csvFilename);

        res.json({
            success: true,
            message: `Data exported to ${csvFilename}`,
            filename: csvFilename,
            count: campaigns.length
        });
    } catch (error) {
        console.error('Error exporting Google Ads data:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to export Google Ads data',
            error: error.message
        });
    }
});

// Get available date range options
router.get('/date-ranges', (req, res) => {
    const dateRanges = [
        { value: 'today', label: 'Today' },
        { value: 'yesterday', label: 'Yesterday' },
        { value: 'last_7_days', label: 'Last 7 Days' },
        { value: 'last_30_days', label: 'Last 30 Days' },
        { value: 'this_month', label: 'This Month' },
        { value: 'custom', label: 'Custom Range' }
    ];

    res.json({
        success: true,
        data: dateRanges
    });
});

module.exports = router; 