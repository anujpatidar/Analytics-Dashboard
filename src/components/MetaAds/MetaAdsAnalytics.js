import React, { useState, useEffect } from 'react';
import { Line, Bar, Pie } from 'react-chartjs-2';
import { 
  FiDollarSign, 
  FiEye, 
  FiMousePointer,
  FiRefreshCw,
  FiTrendingUp,
  FiTrendingDown,
  FiDownload,
  FiTarget,
  FiUsers,
  FiShoppingCart
} from 'react-icons/fi';
import { FaFacebook } from 'react-icons/fa';
import { formatCurrency, formatNumber } from '../../utils/formatters';
import * as metaAdsAPI from '../../api/metaAdsAPI';

const MetaAdsAnalytics = () => {
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState(null);
  const [campaigns, setCampaigns] = useState([]);
  const [dateRange, setDateRange] = useState('last_30_days');
  const [customDateRange, setCustomDateRange] = useState({ since: '', until: '' });
  const [error, setError] = useState(null);

  const dateRangeOptions = [
    { value: 'today', label: 'Today' },
    { value: 'yesterday', label: 'Yesterday' },
    { value: 'last_7_days', label: 'Last 7 Days' },
    { value: 'last_30_days', label: 'Last 30 Days' },
    { value: 'this_month', label: 'This Month' },
    { value: 'custom', label: 'Custom Range' }
  ];

  const fetchData = async (selectedDateRange = dateRange) => {
    setLoading(true);
    setError(null);
    
    try {
      let queryParams = { dateRange: selectedDateRange };
      
      if (selectedDateRange === 'custom' && customDateRange.since && customDateRange.until) {
        queryParams = {
          since: customDateRange.since,
          until: customDateRange.until
        };
      }

      const [summaryResponse, campaignResponse] = await Promise.all([
        metaAdsAPI.getSummary(queryParams),
        metaAdsAPI.getCampaigns(queryParams)
      ]);

      setSummary(summaryResponse.data);
      setCampaigns(campaignResponse.data);
    } catch (err) {
      setError('Failed to fetch Meta Ads data: ' + err.message);
      console.error('Meta Ads fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDateRangeChange = (e) => {
    const selectedRange = e.target.value;
    setDateRange(selectedRange);
    
    if (selectedRange !== 'custom') {
      fetchData(selectedRange);
    }
  };

  const handleCustomDateSubmit = () => {
    if (customDateRange.since && customDateRange.until) {
      fetchData('custom');
    }
  };

  const exportToCsv = async () => {
    try {
      setLoading(true);
      let params = { dateRange };
      
      if (dateRange === 'custom' && customDateRange.since && customDateRange.until) {
        params = customDateRange;
      }

      await metaAdsAPI.exportToCsv(params);
      alert('Data exported successfully!');
    } catch (err) {
      alert('Export failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Prepare chart data
  const prepareSpendChart = () => {
    if (!campaigns.length) return null;

    const sortedCampaigns = [...campaigns]
      .sort((a, b) => b.spend - a.spend)
      .slice(0, 10);

    return {
      labels: sortedCampaigns.map(c => c.campaign_name || c.campaign_id),
      datasets: [{
        label: 'Ad Spend (₹)',
        data: sortedCampaigns.map(c => c.spend),
        backgroundColor: 'rgba(59, 130, 246, 0.5)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 1
      }]
    };
  };

  const prepareRoasChart = () => {
    if (!campaigns.length) return null;

    const campaignsWithRoas = campaigns
      .filter(c => c.overall_roas > 0)
      .sort((a, b) => b.overall_roas - a.overall_roas)
      .slice(0, 10);

    return {
      labels: campaignsWithRoas.map(c => c.campaign_name || c.campaign_id),
      datasets: [{
        label: 'ROAS',
        data: campaignsWithRoas.map(c => c.overall_roas),
        backgroundColor: 'rgba(34, 197, 94, 0.5)',
        borderColor: 'rgba(34, 197, 94, 1)',
        borderWidth: 1
      }]
    };
  };

  const StatCard = ({ title, value, icon: Icon, color = 'blue', change, prefix = '' }) => (
    <div className="bg-white p-6 rounded-lg shadow-md border-l-4" style={{ borderLeftColor: color }}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">
            {prefix}{typeof value === 'number' ? formatNumber(value) : value}
          </p>
          {change && (
            <div className={`flex items-center mt-1 ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {change >= 0 ? <FiTrendingUp className="w-4 h-4 mr-1" /> : <FiTrendingDown className="w-4 h-4 mr-1" />}
              <span className="text-sm font-medium">{Math.abs(change).toFixed(1)}%</span>
            </div>
          )}
        </div>
        <div className="p-3 rounded-full" style={{ backgroundColor: `${color}20` }}>
          <Icon className="w-6 h-6" style={{ color }} />
        </div>
      </div>
    </div>
  );

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
        <strong>Error:</strong> {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <FaFacebook className="w-8 h-8 text-blue-600" />
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Meta Ads Analytics</h2>
              <p className="text-gray-600">Monitor your Facebook & Instagram ad performance</p>
            </div>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => fetchData()}
              disabled={loading}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              <FiRefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button
              onClick={exportToCsv}
              disabled={loading}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              <FiDownload className="w-4 h-4 mr-2" />
              Export CSV
            </button>
          </div>
        </div>

        {/* Date Range Selector */}
        <div className="flex flex-wrap items-center space-x-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
            <select
              value={dateRange}
              onChange={handleDateRangeChange}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {dateRangeOptions.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>

          {dateRange === 'custom' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">From</label>
                <input
                  type="date"
                  value={customDateRange.since}
                  onChange={(e) => setCustomDateRange(prev => ({ ...prev, since: e.target.value }))}
                  className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">To</label>
                <input
                  type="date"
                  value={customDateRange.until}
                  onChange={(e) => setCustomDateRange(prev => ({ ...prev, until: e.target.value }))}
                  className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex items-end">
                <button
                  onClick={handleCustomDateSubmit}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                >
                  Apply
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {loading && (
        <div className="flex justify-center items-center py-12">
          <FiRefreshCw className="w-8 h-8 animate-spin text-blue-600" />
          <span className="ml-2 text-gray-600">Loading Meta Ads data...</span>
        </div>
      )}

      {/* Summary Stats */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total Spend"
            value={summary.spend}
            icon={FiDollarSign}
            color="#dc2626"
            prefix="₹"
          />
          <StatCard
            title="Impressions"
            value={summary.impressions}
            icon={FiEye}
            color="#2563eb"
          />
          <StatCard
            title="Clicks"
            value={summary.clicks}
            icon={FiMousePointer}
            color="#7c3aed"
          />
          <StatCard
            title="Purchases"
            value={summary.total_purchases}
            icon={FiShoppingCart}
            color="#059669"
          />
          <StatCard
            title="CTR"
            value={`${summary.ctr?.toFixed(2)}%`}
            icon={FiTarget}
            color="#dc2626"
          />
          <StatCard
            title="CPC"
            value={summary.cpc}
            icon={FiDollarSign}
            color="#7c2d12"
            prefix="₹"
          />
          <StatCard
            title="ROAS"
            value={`${summary.overall_roas?.toFixed(2)}x`}
            icon={FiTrendingUp}
            color="#059669"
          />
          <StatCard
            title="Reach"
            value={summary.reach}
            icon={FiUsers}
            color="#0891b2"
          />
        </div>
      )}

      {/* Charts */}
      {campaigns.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Spend Chart */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Campaigns by Spend</h3>
            <div className="h-80">
              <Bar 
                data={prepareSpendChart()} 
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { display: false }
                  }
                }}
              />
            </div>
          </div>

          {/* ROAS Chart */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Campaigns by ROAS</h3>
            <div className="h-80">
              <Bar 
                data={prepareRoasChart()} 
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { display: false }
                  }
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Campaign Table */}
      {campaigns.length > 0 && (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Campaign Performance</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Campaign</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Spend</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Impressions</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Clicks</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CTR</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CPC</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Purchases</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ROAS</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {campaigns.slice(0, 10).map((campaign, index) => (
                  <tr key={campaign.campaign_id || index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {campaign.campaign_name || campaign.campaign_id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ₹{formatNumber(campaign.spend)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatNumber(campaign.impressions)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatNumber(campaign.clicks)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {campaign.ctr?.toFixed(2)}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ₹{campaign.cpc?.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {campaign.total_purchases || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        campaign.overall_roas >= 2 
                          ? 'bg-green-100 text-green-800' 
                          : campaign.overall_roas >= 1 
                            ? 'bg-yellow-100 text-yellow-800' 
                            : 'bg-red-100 text-red-800'
                      }`}>
                        {campaign.overall_roas?.toFixed(2)}x
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default MetaAdsAnalytics; 