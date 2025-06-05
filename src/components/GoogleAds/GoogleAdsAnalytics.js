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
  FiShoppingCart,
  FiSearch
} from 'react-icons/fi';
import { FaGoogle } from 'react-icons/fa';
import { formatCurrency, formatNumber } from '../../utils/formatters';
import * as googleAdsAPI from '../../api/googleAdsAPI';

const GoogleAdsAnalytics = () => {
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState(null);
  const [campaigns, setCampaigns] = useState([]);
  const [keywords, setKeywords] = useState([]);
  const [dateRange, setDateRange] = useState('last_30_days');
  const [customDateRange, setCustomDateRange] = useState({ since: '', until: '' });
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('campaigns');

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

      const [summaryResponse, campaignResponse, keywordsResponse] = await Promise.all([
        googleAdsAPI.getSummary(queryParams),
        googleAdsAPI.getCampaigns(queryParams),
        googleAdsAPI.getKeywords({ ...queryParams, limit: 20 })
      ]);

      setSummary(summaryResponse.data);
      setCampaigns(campaignResponse.data);
      setKeywords(keywordsResponse.data);
    } catch (err) {
      setError('Failed to fetch Google Ads data: ' + err.message);
      console.error('Google Ads fetch error:', err);
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

      await googleAdsAPI.exportToCsv(params);
      alert('Data exported successfully!');
    } catch (err) {
      alert('Export failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Prepare chart data
  const prepareCostChart = () => {
    if (!campaigns.length) return null;

    const sortedCampaigns = [...campaigns]
      .sort((a, b) => b.cost - a.cost)
      .slice(0, 10);

    return {
      labels: sortedCampaigns.map(c => c.campaign_name || c.campaign_id),
      datasets: [{
        label: 'Cost (₹)',
        data: sortedCampaigns.map(c => c.cost),
        backgroundColor: 'rgba(52, 168, 83, 0.5)',
        borderColor: 'rgba(52, 168, 83, 1)',
        borderWidth: 1
      }]
    };
  };

  const prepareRoasChart = () => {
    if (!campaigns.length) return null;

    const campaignsWithRoas = campaigns
      .filter(c => c.roas > 0)
      .sort((a, b) => b.roas - a.roas)
      .slice(0, 10);

    return {
      labels: campaignsWithRoas.map(c => c.campaign_name || c.campaign_id),
      datasets: [{
        label: 'ROAS',
        data: campaignsWithRoas.map(c => c.roas),
        backgroundColor: 'rgba(66, 133, 244, 0.5)',
        borderColor: 'rgba(66, 133, 244, 1)',
        borderWidth: 1
      }]
    };
  };

  const prepareConversionChart = () => {
    if (!campaigns.length) return null;

    const campaignsWithConversions = campaigns
      .filter(c => c.conversions > 0)
      .sort((a, b) => b.conversions - a.conversions)
      .slice(0, 8);

    return {
      labels: campaignsWithConversions.map(c => c.campaign_name || c.campaign_id),
      datasets: [{
        label: 'Conversions',
        data: campaignsWithConversions.map(c => c.conversions),
        backgroundColor: 'rgba(234, 67, 53, 0.5)',
        borderColor: 'rgba(234, 67, 53, 1)',
        borderWidth: 1
      }]
    };
  };

  const StatCard = ({ title, value, icon: Icon, color = '#4285f4', change, prefix = '' }) => (
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
            <FaGoogle className="w-8 h-8 text-blue-600" />
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Google Ads Analytics</h2>
              <p className="text-gray-600">Monitor your Google Ads campaign performance</p>
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
          <span className="ml-2 text-gray-600">Loading Google Ads data...</span>
        </div>
      )}

      {/* Summary Stats */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total Cost"
            value={summary.cost}
            icon={FiDollarSign}
            color="#ea4335"
            prefix="₹"
          />
          <StatCard
            title="Impressions"
            value={summary.impressions}
            icon={FiEye}
            color="#4285f4"
          />
          <StatCard
            title="Clicks"
            value={summary.clicks}
            icon={FiMousePointer}
            color="#34a853"
          />
          <StatCard
            title="Conversions"
            value={summary.conversions}
            icon={FiShoppingCart}
            color="#fbbc04"
          />
          <StatCard
            title="CTR"
            value={`${summary.ctr?.toFixed(2)}%`}
            icon={FiTarget}
            color="#ea4335"
          />
          <StatCard
            title="CPC"
            value={summary.cpc}
            icon={FiDollarSign}
            color="#34a853"
            prefix="₹"
          />
          <StatCard
            title="ROAS"
            value={`${summary.roas?.toFixed(2)}x`}
            icon={FiTrendingUp}
            color="#4285f4"
          />
          <StatCard
            title="Conv. Rate"
            value={`${summary.conversion_rate?.toFixed(2)}%`}
            icon={FiUsers}
            color="#fbbc04"
          />
        </div>
      )}

      {/* Tab Navigation */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('campaigns')}
              className={`py-4 px-2 border-b-2 font-medium text-sm ${
                activeTab === 'campaigns'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Campaigns
            </button>
            <button
              onClick={() => setActiveTab('keywords')}
              className={`py-4 px-2 border-b-2 font-medium text-sm ${
                activeTab === 'keywords'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Keywords
            </button>
            <button
              onClick={() => setActiveTab('charts')}
              className={`py-4 px-2 border-b-2 font-medium text-sm ${
                activeTab === 'charts'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Charts
            </button>
          </nav>
        </div>

        <div className="p-6">
          {/* Campaigns Tab */}
          {activeTab === 'campaigns' && campaigns.length > 0 && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Campaign</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cost</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Impressions</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Clicks</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CTR</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CPC</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Conversions</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ROAS</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {campaigns.slice(0, 15).map((campaign, index) => (
                    <tr key={campaign.campaign_id || index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {campaign.campaign_name || campaign.campaign_id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ₹{formatNumber(campaign.cost)}
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
                        {campaign.conversions?.toFixed(1) || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          campaign.roas >= 2 
                            ? 'bg-green-100 text-green-800' 
                            : campaign.roas >= 1 
                              ? 'bg-yellow-100 text-yellow-800' 
                              : 'bg-red-100 text-red-800'
                        }`}>
                          {campaign.roas?.toFixed(2)}x
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Keywords Tab */}
          {activeTab === 'keywords' && keywords.length > 0 && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Keyword</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Match Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Campaign</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cost</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Clicks</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CPC</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Conversions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {keywords.map((keyword, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {keyword.keyword_text}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <span className="inline-flex px-2 py-1 text-xs font-medium bg-gray-100 rounded-md">
                          {keyword.match_type}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {keyword.campaign_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ₹{keyword.cost?.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {keyword.clicks}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ₹{keyword.cpc?.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {keyword.conversions?.toFixed(1) || 0}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Charts Tab */}
          {activeTab === 'charts' && campaigns.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Cost Chart */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Campaigns by Cost</h3>
                <div className="h-80">
                  <Bar 
                    data={prepareCostChart()} 
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
              <div className="bg-gray-50 p-4 rounded-lg">
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

              {/* Conversions Chart */}
              <div className="bg-gray-50 p-4 rounded-lg lg:col-span-2">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Campaigns by Conversions</h3>
                <div className="h-80">
                  <Bar 
                    data={prepareConversionChart()} 
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
        </div>
      </div>
    </div>
  );
};

export default GoogleAdsAnalytics; 