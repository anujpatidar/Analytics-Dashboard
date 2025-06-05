const express = require('express');
const router = express.Router();
const MetaAdsAnalytics = require('../utils/MetaAdsAnalytics');

// Initialize Meta Ads Analytics (you should move these to environment variables)
const initializeMetaAds = () => {
    const accessToken = process.env.META_ACCESS_TOKEN || 'EAATpfGwjZCXkBO33nuWkRLZCpRpsBbNU5EVkes11zoG5VewkbMqYZC2aDn2H4y5tYCQye4ZBd2OQBSQ1al25QJNAM8TMZBWUkDQpH89C3D9kC9azE7hwTDq7HA2CpIbq9rzPqBjyPlcjYUtydyR5dCX0pdWltSbRdcZBI3iqmjBtvORMy6MMpM';
    const appId = process.env.META_APP_ID || '1609334849774379';
    const appSecret = process.env.META_APP_SECRET || 'c43c137e36f234e9a9f38df459d018bd';
    const adAccountId = process.env.META_AD_ACCOUNT_ID || 'act_1889983027860390';

    return new MetaAdsAnalytics(accessToken, appId, appSecret, adAccountId);
};

// Get account summary
router.get('/summary', async (req, res) => {
    try {
        const { dateRange } = req.query;
        const analytics = initializeMetaAds();
        
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
        console.error('Error fetching Meta Ads summary:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch Meta Ads summary',
            error: error.message
        });
    }
});

// Get campaign insights
router.get('/campaigns', async (req, res) => {
    try {
        const { dateRange, campaignIds } = req.query;
        const analytics = initializeMetaAds();
        
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
        console.error('Error fetching Meta Ads campaigns:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch Meta Ads campaigns',
            error: error.message
        });
    }
});

// Export campaigns to CSV
router.post('/export-csv', async (req, res) => {
    try {
        const { dateRange, campaignIds, filename } = req.body;
        const analytics = initializeMetaAds();
        
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
        
        const csvFilename = filename || `meta_ads_campaigns_${Date.now()}.csv`;
        await analytics.exportToCSV(campaigns, csvFilename);

        res.json({
            success: true,
            message: `Data exported to ${csvFilename}`,
            filename: csvFilename,
            count: campaigns.length
        });
    } catch (error) {
        console.error('Error exporting Meta Ads data:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to export Meta Ads data',
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