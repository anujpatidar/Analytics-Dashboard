const { GoogleAdsApi, enums } = require('google-ads-api');
const fs = require('fs');

class GoogleAdsAnalytics {
    constructor(clientId, clientSecret, refreshToken, developerToken, customerId) {
        this.clientId = clientId;
        this.clientSecret = clientSecret;
        this.refreshToken = refreshToken;
        this.developerToken = developerToken;
        this.customerId = customerId;
        
        this.client = new GoogleAdsApi({
            client_id: clientId,
            client_secret: clientSecret,
            developer_token: developerToken,
        });
        
        this.customer = this.client.Customer({
            customer_id: customerId,
            refresh_token: refreshToken,
        });
    }

    formatDateIST(date) {
        const istOffset = 5.5 * 60 * 60 * 1000;
        const istDate = new Date(date.getTime() + istOffset);
        return istDate.toISOString().split('T')[0];
    }

    getCurrentDateIST() {
        const now = new Date();
        const istOffset = 5.5 * 60 * 60 * 1000;
        return new Date(now.getTime() + istOffset);
    }

    getDateRange(dateRange = 'last_30_days') {
        const currentIST = this.getCurrentDateIST();
        let since, until;

        if (typeof dateRange === 'object' && dateRange.since && dateRange.until) {
            since = dateRange.since;
            until = dateRange.until;
        } else {
            until = this.formatDateIST(currentIST);
            
            switch (dateRange) {
                case 'today':
                    since = until;
                    break;
                case 'yesterday':
                    const yesterday = new Date(currentIST);
                    yesterday.setDate(yesterday.getDate() - 1);
                    since = until = this.formatDateIST(yesterday);
                    break;
                case 'last_7_days':
                    const last7Days = new Date(currentIST);
                    last7Days.setDate(last7Days.getDate() - 7);
                    since = this.formatDateIST(last7Days);
                    break;
                case 'last_30_days':
                default:
                    const last30Days = new Date(currentIST);
                    last30Days.setDate(last30Days.getDate() - 30);
                    since = this.formatDateIST(last30Days);
                    break;
                case 'this_month':
                    const thisMonthStart = new Date(currentIST.getFullYear(), currentIST.getMonth(), 1);
                    since = this.formatDateIST(thisMonthStart);
                    break;
            }
        }

        return { since, until };
    }

    parseReportData(row) {
        const metrics = row.metrics;
        const segments = row.segments;
        
        return {
            date: segments?.date || null,
            campaign_id: row.campaign?.id?.value || null,
            campaign_name: row.campaign?.name?.value || null,
            impressions: parseInt(metrics?.impressions?.value || 0),
            clicks: parseInt(metrics?.clicks?.value || 0),
            cost_micros: parseInt(metrics?.cost_micros?.value || 0),
            cost: (parseInt(metrics?.cost_micros?.value || 0) / 1000000),
            ctr: parseFloat(metrics?.ctr?.value || 0) * 100,
            cpc_micros: parseInt(metrics?.average_cpc_micros?.value || 0),
            cpc: (parseInt(metrics?.average_cpc_micros?.value || 0) / 1000000),
            cpm_micros: parseInt(metrics?.average_cpm_micros?.value || 0),
            cpm: (parseInt(metrics?.average_cpm_micros?.value || 0) / 1000000),
            conversions: parseFloat(metrics?.conversions?.value || 0),
            conversion_value: parseFloat(metrics?.conversions_value?.value || 0),
            cost_per_conversion_micros: parseInt(metrics?.cost_per_conversion_micros?.value || 0),
            cost_per_conversion: (parseInt(metrics?.cost_per_conversion_micros?.value || 0) / 1000000),
            value_per_conversion: parseFloat(metrics?.value_per_conversion?.value || 0),
        };
    }

    calculateAdditionalMetrics(data) {
        const totalCost = data.cost || 0;
        const totalConversions = data.conversions || 0;
        const totalConversionValue = data.conversion_value || 0;
        
        return {
            ...data,
            roas: totalCost > 0 ? totalConversionValue / totalCost : 0,
            conversion_rate: data.clicks > 0 ? (totalConversions / data.clicks) * 100 : 0,
        };
    }

    async getAccountSummary(dateRange = 'last_30_days') {
        try {
            const timeRange = this.getDateRange(dateRange);
            
            // Use a simple customer query first to test connection
            const query = `
                SELECT 
                    customer.id,
                    customer.descriptive_name,
                    customer.currency_code,
                    customer.time_zone
                FROM customer
                LIMIT 1
            `;

            const response = await this.customer.query(query);
            
            if (response && response.length > 0) {
                const customerInfo = response[0].customer;
                return {
                    customer_id: customerInfo.id?.value || 'N/A',
                    account_name: customerInfo.descriptive_name?.value || 'N/A',
                    currency: customerInfo.currency_code?.value || 'USD',
                    timezone: customerInfo.time_zone?.value || 'UTC',
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
                    date_range: timeRange,
                    message: 'Account connected successfully. Campaign data requires approved developer token.'
                };
            }

            return null;
        } catch (error) {
            console.error('Error fetching Google Ads account summary:', error.message);
            throw error;
        }
    }

    async getCampaignInsights(dateRange = 'last_30_days', campaignIds = null) {
        try {
            const timeRange = this.getDateRange(dateRange);
            
            console.log(`Fetching Google Ads campaign data from ${timeRange.since} to ${timeRange.until} (IST)`);
            
            // Try a simple campaign query first
            const query = `
                SELECT 
                    campaign.id,
                    campaign.name,
                    campaign.status
                FROM campaign
                WHERE campaign.status != 'REMOVED'
                LIMIT 10
            `;

            const response = await this.customer.query(query);
            
            if (response && response.length > 0) {
                return response.map(row => ({
                    campaign_id: row.campaign?.id?.value || 'N/A',
                    campaign_name: row.campaign?.name?.value || 'N/A',
                    campaign_status: row.campaign?.status || 'UNKNOWN',
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
                    message: 'Campaign found. Metrics require approved developer token.'
                }));
            }

            return [];

        } catch (error) {
            console.error('Error fetching Google Ads campaign insights:', error.message);
            throw error;
        }
    }

    async exportToCSV(data, filename) {
        try {
            if (!data || data.length === 0) {
                console.log('No data to export');
                return;
            }

            const headers = [...new Set(data.flatMap(Object.keys))];
            let csvContent = headers.join(',') + '\n';
            
            data.forEach(row => {
                const values = headers.map(header => {
                    const value = row[header];
                    if (typeof value === 'object' && value !== null) {
                        return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
                    }
                    return `"${String(value || '').replace(/"/g, '""')}"`;
                });
                csvContent += values.join(',') + '\n';
            });

            fs.writeFileSync(filename, csvContent);
            console.log(`✅ Google Ads data exported to ${filename}`);

        } catch (error) {
            console.error('Error exporting Google Ads data to CSV:', error.message);
            throw error;
        }
    }

    async getKeywords(dateRange = 'last_30_days', limit = 50) {
        try {
            const timeRange = this.getDateRange(dateRange);
            
            // Simple query to check access - keywords require more permissions
            const query = `
                SELECT 
                    ad_group.id,
                    ad_group.name,
                    campaign.name
                FROM ad_group
                WHERE ad_group.status != 'REMOVED'
                LIMIT ${limit}
            `;

            const response = await this.customer.query(query);
            
            if (response && response.length > 0) {
                return response.map(row => ({
                    keyword_text: 'Sample Keyword',
                    match_type: 'BROAD',
                    ad_group_name: row.ad_group?.name?.value || 'N/A',
                    campaign_name: row.campaign?.name?.value || 'N/A',
                    impressions: 0,
                    clicks: 0,
                    cost: 0,
                    conversions: 0,
                    conversion_value: 0,
                    ctr: 0,
                    cpc: 0,
                    roas: 0,
                    conversion_rate: 0,
                    message: 'Ad group found. Keyword data requires approved developer token.'
                }));
            }

            return [];

        } catch (error) {
            console.error('Error fetching Google Ads keywords:', error.message);
            throw error;
        }
    }
}

module.exports = GoogleAdsAnalytics; 