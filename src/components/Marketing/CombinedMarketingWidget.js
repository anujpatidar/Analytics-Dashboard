import React, { useState, useEffect } from 'react';
import { Pie } from 'react-chartjs-2';
import { 
  FiDollarSign, 
  FiTrendingUp,
  FiBarChart,
  FiExternalLink
} from 'react-icons/fi';
import { FaGoogle, FaFacebook } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import { formatCurrency, formatNumber } from '../../utils/formatters';
import * as metaAdsAPI from '../../api/metaAdsAPI';
import * as googleAdsAPI from '../../api/googleAdsAPI';
import { getOrdersOverview } from '../../api/ordersAPI';

const CombinedMarketingWidget = ({ dateRange = 'last_7_days', customDateRange = null, isCustomDateRange = false }) => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [debug, setDebug] = useState(null);

  // Helper functions to match dashboard date range calculation
  const toIST = (date) => {
    const istOffset = 5.5 * 60 * 60 * 1000;
    return new Date(date.getTime() + istOffset);
  };

  const toUTC = (date) => {
    const istOffset = 5.5 * 60 * 60 * 1000;
    return new Date(date.getTime() - istOffset);
  };

  const getDateRange = (timeframe) => {
    if (isCustomDateRange && customDateRange && customDateRange[0] && customDateRange[1]) {
      return {
        startDate: new Date(customDateRange[0]).toISOString(),
        endDate: new Date(customDateRange[1]).toISOString()
      };
    }

    const end = new Date();
    let start = new Date();
    
    switch(timeframe.toLowerCase()) {
      case 'day':
        start.setDate(end.getDate() - 1);
        break;
      case 'week':
        start.setDate(end.getDate() - 7);
        break;
      case 'month':
        start.setDate(end.getDate() - 30);
        break;
      case 'year':
        start.setDate(end.getDate() - 365);
        break;
      default:
        start.setDate(end.getDate() - 7);
    }
    
    return {
      startDate: start.toISOString(),
      endDate: end.toISOString()
    };
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      setDebug(null);

      // Use the same date range calculation as dashboard
      const currentDateRange = getDateRange(dateRange);
      
      // Convert dashboard timeframe to marketing API format
      let marketingDateRange;
      if (isCustomDateRange && customDateRange && customDateRange[0] && customDateRange[1]) {
        marketingDateRange = {
          since: new Date(customDateRange[0]).toISOString().split('T')[0],
          until: new Date(customDateRange[1]).toISOString().split('T')[0]
        };
      } else {
        // Map dashboard timeframes to marketing API format
        const timeframeMap = {
          'day': 'today',
          'week': 'last_7_days',
          'month': 'last_30_days',
          'year': 'last_30_days' // Marketing APIs don't usually support a full year
        };
        marketingDateRange = { dateRange: timeframeMap[dateRange] || 'last_7_days' };
      }

      console.log('=== USING DASHBOARD APPROACH ===');
      console.log('Dashboard timeframe:', dateRange);
      console.log('Calculated date range for orders:', currentDateRange);
      console.log('Marketing API params:', marketingDateRange);
      console.log('=================================');

      // Fetch data - use EXACT same approach as dashboard
      const results = await Promise.allSettled([
        metaAdsAPI.getSummary(marketingDateRange),
        googleAdsAPI.getSummary(marketingDateRange),
        getOrdersOverview(currentDateRange) // Use exact same function as dashboard
      ]);

      console.log('API Results:');
      console.log('Meta Ads:', results[0]);
      console.log('Google Ads:', results[1]);
      console.log('Orders:', results[2]);

      // Process results
      const debugInfo = {
        metaAds: { status: results[0].status, data: null, error: null },
        googleAds: { status: results[1].status, data: null, error: null },
        orders: { status: results[2].status, data: null, error: null }
      };

      let metaAdsData = null;
      let googleAdsData = null;
      let ordersData = null;

      if (results[0].status === 'fulfilled') {
        metaAdsData = results[0].value?.data;
        debugInfo.metaAds.data = metaAdsData;
      } else {
        debugInfo.metaAds.error = results[0].reason?.message || 'Unknown error';
      }

      if (results[1].status === 'fulfilled') {
        googleAdsData = results[1].value?.data;
        debugInfo.googleAds.data = googleAdsData;
      } else {
        debugInfo.googleAds.error = results[1].reason?.message || 'Unknown error';
      }

      if (results[2].status === 'fulfilled') {
        ordersData = results[2].value; // Orders API returns data directly, not in .data
        debugInfo.orders.data = ordersData;
      } else {
        debugInfo.orders.error = results[2].reason?.message || 'Unknown error';
      }

      setDebug(debugInfo);

      console.log('=== EXTRACTED DATA ===');
      console.log('Meta Ads Data:', metaAdsData);
      console.log('Google Ads Data:', googleAdsData);
      console.log('Orders Data:', ordersData);
      console.log('======================');

      // Calculate metrics using SAME data as dashboard
      const metaCost = metaAdsData?.spend || metaAdsData?.cost || 0;
      const googleCost = googleAdsData?.cost || 0;
      const totalMarketingCost = metaCost + googleCost;
      
      // Use the SAME revenue field as dashboard: ordersOverview?.total_revenue
      const totalRevenue = ordersData?.total_revenue || 0;
      
      const blendedRoas = totalMarketingCost > 0 ? totalRevenue / totalMarketingCost : 0;
      const marketingPercentage = totalRevenue > 0 ? (totalMarketingCost / totalRevenue) * 100 : 0;
      const contributionMargin = totalRevenue - totalMarketingCost;
      const cm2Percentage = totalRevenue > 0 ? (contributionMargin / totalRevenue) * 100 : 0;

      console.log('=== FINAL CALCULATION ===');
      console.log('Meta Cost:', metaCost);
      console.log('Google Cost:', googleCost);
      console.log('Total Marketing Cost:', totalMarketingCost);
      console.log('Total Revenue (from orders):', totalRevenue);
      console.log('Marketing %:', marketingPercentage.toFixed(2) + '%');
      console.log('========================');

      setData({
        totalMarketingCost,
        totalRevenue,
        blendedRoas,
        marketingPercentage,
        contributionMargin,
        cm2Percentage,
        metaCost,
        googleCost,
        channels: [
          { name: 'Meta Ads', cost: metaCost, color: '#1877f2' },
          { name: 'Google Ads', cost: googleCost, color: '#34a853' }
        ]
      });

    } catch (err) {
      setError(err.message);
      setDebug({ error: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [dateRange, customDateRange, isCustomDateRange]);

  const getDateRangeLabel = () => {
    if (isCustomDateRange && customDateRange && customDateRange[0] && customDateRange[1]) {
      const startDate = new Date(customDateRange[0]).toLocaleDateString();
      const endDate = new Date(customDateRange[1]).toLocaleDateString();
      return `${startDate} - ${endDate}`;
    }
    
    switch (dateRange) {
      case 'today':
        return 'Today';
      case 'yesterday':
        return 'Yesterday';
      case 'last_7_days':
      case 'week':
        return 'Last 7 days';
      case 'last_30_days':
      case 'month':
        return 'Last 30 days';
      case 'this_month':
        return 'This month';
      case 'year':
        return 'Last year';
      default:
        return 'Last 7 days';
    }
  };

  const prepareChartData = () => {
    if (!data || (data.metaCost === 0 && data.googleCost === 0)) return null;

    return {
      labels: ['Meta Ads', 'Google Ads'],
      datasets: [{
        data: [data.metaCost, data.googleCost],
        backgroundColor: ['rgba(24, 119, 242, 0.8)', 'rgba(52, 168, 83, 0.8)'],
        borderColor: ['rgba(24, 119, 242, 1)', 'rgba(52, 168, 83, 1)'],
        borderWidth: 1
      }]
    };
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <FiBarChart className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">Marketing Overview</h3>
          </div>
        </div>
        <div className="flex justify-center items-center h-40">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <FiBarChart className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">Marketing Overview</h3>
          </div>
        </div>
        <div className="space-y-3">
          <div className="text-center py-4">
            <p className="text-gray-500 text-sm mb-3">
              {error || 'Unable to load marketing data'}
            </p>
            {debug && (
              <div className="bg-gray-50 border rounded p-3 text-xs text-left">
                <div className="font-semibold mb-2">Debug Info:</div>
                {debug.error && <div className="text-red-600 mb-1">Error: {debug.error}</div>}
                {debug.metaAds && (
                  <div className="mb-1">
                    Meta Ads: {debug.metaAds.status} 
                    {debug.metaAds.error && ` - ${debug.metaAds.error}`}
                    {debug.metaAds.message && ` - ${debug.metaAds.message}`}
                  </div>
                )}
                {debug.googleAds && (
                  <div className="mb-1">
                    Google Ads: {debug.googleAds.status}
                    {debug.googleAds.error && ` - ${debug.googleAds.error}`}
                    {debug.googleAds.message && ` - ${debug.googleAds.message}`}
                    {debug.googleAds.tokenStatus && ` (${debug.googleAds.tokenStatus})`}
                  </div>
                )}
                {debug.orders && (
                  <div>
                    Orders: {debug.orders.status}
                    {debug.orders.error && ` - ${debug.orders.error}`}
                  </div>
                )}
              </div>
            )}
          </div>
          <button 
            onClick={fetchData}
            className="w-full px-3 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <FiBarChart className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">Marketing Overview</h3>
        </div>
        <Link 
          to="/combined-marketing"
          className="text-blue-600 hover:text-blue-800 transition-colors"
        >
          <FiExternalLink className="w-4 h-4" />
        </Link>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="text-center">
          <p className="text-xs text-gray-500 mb-1">Total Marketing Cost</p>
          <p className="text-lg font-bold text-red-600">₹{formatNumber(data.totalMarketingCost)}</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-500 mb-1">Blended ROAS</p>
          <p className={`text-lg font-bold ${
            data.blendedRoas >= 2 ? 'text-green-600' : 
            data.blendedRoas >= 1 ? 'text-yellow-600' : 'text-red-600'
          }`}>
            {data.blendedRoas.toFixed(2)}x
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-500 mb-1">Marketing %</p>
          <p className="text-lg font-bold text-orange-600">{data.marketingPercentage.toFixed(1)}%</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-500 mb-1">CM2%</p>
          <p className={`text-lg font-bold ${
            data.cm2Percentage >= 50 ? 'text-green-600' : 
            data.cm2Percentage >= 30 ? 'text-yellow-600' : 'text-red-600'
          }`}>
            {data.cm2Percentage.toFixed(1)}%
          </p>
        </div>
      </div>

      {/* Channel Breakdown Chart */}
      {prepareChartData() && (
        <div className="mb-6">
          <p className="text-sm font-medium text-gray-700 mb-3 text-center">
            Spend by Channel ({getDateRangeLabel()})
          </p>
          <div className="h-32 flex justify-center">
            <Pie 
              data={prepareChartData()} 
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    display: false
                  },
                  tooltip: {
                    callbacks: {
                      label: function(context) {
                        const percentage = ((context.raw / data.totalMarketingCost) * 100).toFixed(1);
                        return `${context.label}: ₹${formatNumber(context.raw)} (${percentage}%)`;
                      }
                    }
                  }
                }
              }}
            />
          </div>
        </div>
      )}

      {/* Channel Summary */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <FaFacebook className="w-4 h-4 text-blue-600" />
            <span className="text-sm text-gray-700">Meta Ads</span>
          </div>
          <span className="text-sm font-medium text-gray-900">₹{formatNumber(data.metaCost)}</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <FaGoogle className="w-4 h-4 text-green-600" />
            <span className="text-sm text-gray-700">Google Ads</span>
          </div>
          <span className="text-sm font-medium text-gray-900">₹{formatNumber(data.googleCost)}</span>
        </div>
      </div>

      {/* Contribution Margin */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <FiTrendingUp className="w-4 h-4 text-green-600" />
            <span className="text-sm text-gray-700">Contribution Margin</span>
          </div>
          <span className={`text-sm font-medium ${
            data.contributionMargin >= 0 ? 'text-green-600' : 'text-red-600'
          }`}>
            ₹{formatNumber(data.contributionMargin)}
          </span>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="mt-4 pt-3 border-t border-gray-100 text-center">
        <p className="text-xs text-gray-500">
          Revenue: ₹{formatNumber(data.totalRevenue)} | {getDateRangeLabel()}
        </p>
      </div>
    </div>
  );
};

export default CombinedMarketingWidget;