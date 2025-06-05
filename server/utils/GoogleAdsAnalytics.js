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
            
            const query = `
                SELECT 
                    metrics.impressions,
                    metrics.clicks,
                    metrics.cost_micros,
                    metrics.ctr,
                    metrics.average_cpc_micros,
                    metrics.average_cpm_micros,
                    metrics.conversions,
                    metrics.conversions_value,
                    metrics.cost_per_conversion_micros,
                    metrics.value_per_conversion
                FROM customer 
                WHERE segments.date BETWEEN '${timeRange.since}' AND '${timeRange.until}'
            `;

            const response = await this.customer.query(query);
            
            if (response.length > 0) {
                // Aggregate all rows
                const aggregated = response.reduce((acc, row) => {
                    const parsed = this.parseReportData(row);
                    acc.impressions += parsed.impressions;
                    acc.clicks += parsed.clicks;
                    acc.cost += parsed.cost;
                    acc.conversions += parsed.conversions;
                    acc.conversion_value += parsed.conversion_value;
                    return acc;
                }, {
                    impressions: 0,
                    clicks: 0,
                    cost: 0,
                    conversions: 0,
                    conversion_value: 0
                });

                // Calculate derived metrics
                aggregated.ctr = aggregated.impressions > 0 ? (aggregated.clicks / aggregated.impressions) * 100 : 0;
                aggregated.cpc = aggregated.clicks > 0 ? aggregated.cost / aggregated.clicks : 0;
                aggregated.cpm = aggregated.impressions > 0 ? (aggregated.cost / aggregated.impressions) * 1000 : 0;
                aggregated.cost_per_conversion = aggregated.conversions > 0 ? aggregated.cost / aggregated.conversions : 0;
                aggregated.roas = aggregated.cost > 0 ? aggregated.conversion_value / aggregated.cost : 0;
                aggregated.conversion_rate = aggregated.clicks > 0 ? (aggregated.conversions / aggregated.clicks) * 100 : 0;
                aggregated.date_range = timeRange;

                return aggregated;
            }

            return null;
        } catch (error) {
            console.error('Error fetching Google Ads account summary:', error.message);
            
            // Handle test token limitations
            if (error.message.includes('GRPC target method') || error.code === 12) {
                throw new Error('DEVELOPER_TOKEN_NOT_APPROVED: Your test developer token has limited access. Apply for Standard access in Google Ads > Tools & Settings > API Center to access campaign data.');
            }
            
            throw error;
        }
    }

    async getCampaignInsights(dateRange = 'last_30_days', campaignIds = null) {
        try {
            const timeRange = this.getDateRange(dateRange);
            
            console.log(`Fetching Google Ads campaign data from ${timeRange.since} to ${timeRange.until} (IST)`);
            
            let whereClause = `WHERE segments.date BETWEEN '${timeRange.since}' AND '${timeRange.until}'`;
            
            if (campaignIds && campaignIds.length > 0) {
                const campaignFilter = campaignIds.map(id => `'${id}'`).join(',');
                whereClause += ` AND campaign.id IN (${campaignFilter})`;
            }

            const query = `
                SELECT 
                    campaign.id,
                    campaign.name,
                    campaign.status,
                    metrics.impressions,
                    metrics.clicks,
                    metrics.cost_micros,
                    metrics.ctr,
                    metrics.average_cpc_micros,
                    metrics.average_cpm_micros,
                    metrics.conversions,
                    metrics.conversions_value,
                    metrics.cost_per_conversion_micros,
                    metrics.value_per_conversion
                FROM campaign 
                ${whereClause}
                ORDER BY metrics.cost_micros DESC
            `;

            const response = await this.customer.query(query);
            
            // Group by campaign and aggregate metrics
            const campaignMap = new Map();
            
            response.forEach(row => {
                const campaignId = row.campaign?.id?.value;
                const campaignName = row.campaign?.name?.value;
                
                if (!campaignMap.has(campaignId)) {
                    campaignMap.set(campaignId, {
                        campaign_id: campaignId,
                        campaign_name: campaignName,
                        campaign_status: row.campaign?.status?.value,
                        impressions: 0,
                        clicks: 0,
                        cost: 0,
                        conversions: 0,
                        conversion_value: 0
                    });
                }
                
                const campaign = campaignMap.get(campaignId);
                const parsed = this.parseReportData(row);
                
                campaign.impressions += parsed.impressions;
                campaign.clicks += parsed.clicks;
                campaign.cost += parsed.cost;
                campaign.conversions += parsed.conversions;
                campaign.conversion_value += parsed.conversion_value;
            });

            // Calculate derived metrics for each campaign
            const campaigns = Array.from(campaignMap.values()).map(campaign => {
                campaign.ctr = campaign.impressions > 0 ? (campaign.clicks / campaign.impressions) * 100 : 0;
                campaign.cpc = campaign.clicks > 0 ? campaign.cost / campaign.clicks : 0;
                campaign.cpm = campaign.impressions > 0 ? (campaign.cost / campaign.impressions) * 1000 : 0;
                campaign.cost_per_conversion = campaign.conversions > 0 ? campaign.cost / campaign.conversions : 0;
                campaign.roas = campaign.cost > 0 ? campaign.conversion_value / campaign.cost : 0;
                campaign.conversion_rate = campaign.clicks > 0 ? (campaign.conversions / campaign.clicks) * 100 : 0;
                
                return campaign;
            });

            return campaigns;

        } catch (error) {
            console.error('Error fetching Google Ads campaign insights:', error.message);
            
            // Handle test token limitations
            if (error.message.includes('GRPC target method') || error.code === 12) {
                throw new Error('DEVELOPER_TOKEN_NOT_APPROVED: Your test developer token has limited access. Apply for Standard access in Google Ads > Tools & Settings > API Center to access campaign data.');
            }
            
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
            
            const query = `
                SELECT 
                    ad_group_criterion.keyword.text,
                    ad_group_criterion.keyword.match_type,
                    campaign.name,
                    ad_group.name,
                    metrics.impressions,
                    metrics.clicks,
                    metrics.cost_micros,
                    metrics.ctr,
                    metrics.average_cpc_micros,
                    metrics.conversions,
                    metrics.conversions_value
                FROM keyword_view 
                WHERE segments.date BETWEEN '${timeRange.since}' AND '${timeRange.until}'
                    AND ad_group_criterion.type = 'KEYWORD'
                ORDER BY metrics.cost_micros DESC
                LIMIT ${limit}
            `;

            const response = await this.customer.query(query);
            
            return response.map(row => {
                const parsed = this.parseReportData(row);
                return {
                    ...parsed,
                    keyword_text: row.ad_group_criterion?.keyword?.text?.value,
                    match_type: row.ad_group_criterion?.keyword?.match_type?.value,
                    ad_group_name: row.ad_group?.name?.value,
                    ...this.calculateAdditionalMetrics(parsed)
                };
            });

        } catch (error) {
            console.error('Error fetching Google Ads keywords:', error.message);
            
            // Handle test token limitations
            if (error.message.includes('GRPC target method') || error.code === 12) {
                throw new Error('DEVELOPER_TOKEN_NOT_APPROVED: Your test developer token has limited access. Apply for Standard access in Google Ads > Tools & Settings > API Center to access keyword data.');
            }
            
            throw error;
        }
    }
}

module.exports = GoogleAdsAnalytics; 