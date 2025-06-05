const { FacebookAdsApi, AdAccount } = require('facebook-nodejs-business-sdk');
const fs = require('fs');

class MetaAdsAnalytics {
    constructor(accessToken, appId, appSecret, adAccountId) {
        this.accessToken = accessToken;
        this.appId = appId;
        this.appSecret = appSecret;
        this.adAccountId = adAccountId;
        
        FacebookAdsApi.init(accessToken);
        this.adAccount = new AdAccount(adAccountId);
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

    parseInsightData(insight) {
        const data = insight._data || insight;
        
        const parsed = {
            campaign_id: data.campaign_id,
            campaign_name: data.campaign_name,
            impressions: parseInt(data.impressions || 0),
            clicks: parseInt(data.clicks || 0),
            spend: parseFloat(data.spend || 0),
            reach: parseInt(data.reach || 0),
            cpm: parseFloat(data.cpm || 0),
            cpc: parseFloat(data.cpc || 0),
            ctr: parseFloat(data.ctr || 0),
            frequency: parseFloat(data.frequency || 0)
        };

        // Parse ROAS data first
        let totalPurchaseValue = 0;
        if (data.purchase_roas && Array.isArray(data.purchase_roas)) {
            data.purchase_roas.forEach(roas => {
                parsed[`${roas.action_type}_roas`] = parseFloat(roas.value);
                // Calculate purchase value from ROAS
                if (roas.action_type === 'omni_purchase' || roas.action_type === 'purchase') {
                    totalPurchaseValue = parseFloat(roas.value) * parsed.spend;
                }
            });
        }

        // Parse actions (conversion counts)
        if (data.actions && Array.isArray(data.actions)) {
            data.actions.forEach(action => {
                parsed[`${action.action_type}_count`] = parseInt(action.value);
            });
        }

        // Parse conversion values (purchase values)
        if (data.conversion_values && Array.isArray(data.conversion_values)) {
            data.conversion_values.forEach(convValue => {
                parsed[`${convValue.action_type}_value`] = parseFloat(convValue.value);
                // Use conversion values for total purchase value if available
                if (convValue.action_type === 'omni_purchase' || convValue.action_type === 'purchase') {
                    totalPurchaseValue = parseFloat(convValue.value);
                }
            });
        }

        // Calculate final metrics
        const purchaseCount = parsed.purchase_count || parsed.omni_purchase_count || 0;
        
        // Use calculated purchase value or fallback to conversion values
        const finalPurchaseValue = totalPurchaseValue || parsed.purchase_value || parsed.omni_purchase_value || 0;
        
        parsed.total_purchases = purchaseCount;
        parsed.total_purchase_value = finalPurchaseValue;
        parsed.overall_roas = parsed.spend > 0 ? finalPurchaseValue / parsed.spend : 0;
        parsed.cost_per_purchase = purchaseCount > 0 ? parsed.spend / purchaseCount : 0;
        
        return parsed;
    }

    async getAccountSummary(dateRange = 'last_30_days') {
        try {
            const timeRange = this.getDateRange(dateRange);

            const fields = [
                'impressions', 'clicks', 'spend', 'reach', 'cpm', 'cpc', 'ctr',
                'purchase_roas', 'actions', 'conversion_values'
            ];

            const params = {
                time_range: timeRange,
                level: 'account'
            };

            const insights = await this.adAccount.getInsights(fields, params);
            
            if (insights.length > 0) {
                const parsedSummary = this.parseInsightData(insights[0]);
                return { ...parsedSummary, date_range: timeRange };
            }

            return null;
        } catch (error) {
            console.error('Error fetching account summary:', error.message);
            throw error;
        }
    }

    async getCampaignInsights(dateRange = 'last_30_days', campaignIds = null) {
        try {
            const timeRange = this.getDateRange(dateRange);
            
            console.log(`Fetching campaign data from ${timeRange.since} to ${timeRange.until} (IST)`);
            
            const fields = [
                'campaign_id', 'campaign_name', 'impressions', 'clicks', 'spend', 
                'reach', 'frequency', 'cpm', 'cpc', 'ctr', 'actions', 
                'cost_per_action_type', 'purchase_roas', 'conversion_values'
            ];

            const params = {
                time_range: timeRange,
                level: 'campaign'
            };

            if (campaignIds && campaignIds.length > 0) {
                params.filtering = [{
                    field: 'campaign.id',
                    operator: 'IN',
                    value: campaignIds
                }];
            }

            const insights = await this.adAccount.getInsights(fields, params);
            return insights.map(insight => this.parseInsightData(insight));

        } catch (error) {
            console.error('Error fetching campaign insights:', error.message);
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
            console.log(`✅ Data exported to ${filename}`);

        } catch (error) {
            console.error('Error exporting to CSV:', error.message);
            throw error;
        }
    }
}

module.exports = MetaAdsAnalytics; 