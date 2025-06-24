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

const CombinedMarketingWidget = ({ 
  dateRange = 'last_7_days', 
  customDateRange = null, 
  isCustomDateRange = false,
  ordersOverview = null, // Add ordersOverview as a prop from dashboard
  ordersOverviewLoading = false, // Add loading state
  onMarketingDataUpdate = () => {} // Add callback prop
}) => {
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

  useEffect(() => {
    console.log('=== MARKETING WIDGET useEffect TRIGGERED ===');
    console.log('dateRange prop:', dateRange);
    console.log('customDateRange prop:', customDateRange);
    console.log('isCustomDateRange prop:', isCustomDateRange);
    console.log('ordersOverview prop:', ordersOverview);
    console.log('============================================');
    fetchData();
  }, [dateRange, customDateRange, isCustomDateRange, ordersOverview]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      setDebug(null);

      console.log('=== MARKETING WIDGET FETCH DATA START ===');
      console.log('ordersOverview received:', ordersOverview);
      console.log('ordersOverviewLoading:', ordersOverviewLoading);
      
      // Check if ordersOverview is available
      if (!ordersOverview || ordersOverviewLoading) {
        console.log('No ordersOverview data available yet or still loading, will retry when available');
        setLoading(false);
        // Don't set error - just wait for data to be available
        return;
      }

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
        
        // Use date range instead of predefined periods for more accurate results
        const calculatedRange = getDateRange(dateRange);
      //   const formattedStartDate = startDate ? new Date(startDate).toISOString() : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      // const formattedEndDate = endDate ? new Date(endDate).toISOString() : new Date().toISOString();
        marketingDateRange = {
          since: new Date(calculatedRange.startDate).toISOString().split('T')[0],
          until: new Date(calculatedRange.endDate).toISOString().split('T')[0]
        };
      }

      console.log('=== MARKETING WIDGET DATA FETCH ===');
      console.log('Dashboard timeframe:', dateRange);
      console.log('isCustomDateRange:', isCustomDateRange);
      console.log('Calculated date range for orders:', currentDateRange);
      console.log('Marketing API params:', marketingDateRange);
      console.log('===================================');

      // Fetch data - use ordersOverview from dashboard instead of fetching separately
      const results = await Promise.allSettled([
        metaAdsAPI.getSummary(marketingDateRange),
        googleAdsAPI.getSummary(marketingDateRange)
      ]);

      console.log('=== MARKETING WIDGET API RESULTS ===');
      console.log('Meta Ads:', results[0]);
      console.log('Google Ads:', results[1]);
      console.log('Orders (from dashboard prop):', ordersOverview);
      console.log('===================================');

      // Process results
      const debugInfo = {
        metaAds: { status: results[0].status, data: null, error: null },
        googleAds: { status: results[1].status, data: null, error: null },
        orders: { status: 'fulfilled', data: ordersOverview, error: null }
      };

      let metaAdsData = null;
      let googleAdsData = null;

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

      setDebug(debugInfo);

      console.log('=== MARKETING WIDGET EXTRACTED DATA ===');
      console.log('Meta Ads Data:', metaAdsData);
      console.log('Google Ads Data:', googleAdsData);
      console.log('Orders Data (from dashboard):', ordersOverview);
      console.log('======================================');

      // Calculate metrics using EXACT SAME data as dashboard
      const metaCost = metaAdsData?.spend || metaAdsData?.cost || 0;
      const googleCost = googleAdsData?.cost || 0;
      const totalMarketingCost = metaCost + googleCost;
      
      // Use the EXACT SAME revenue data as dashboard
      const totalRevenue = ordersOverview?.total_revenue || 0;
      
      const blendedRoas = totalMarketingCost > 0 ? totalRevenue / totalMarketingCost : 0;
      const marketingPercentage = totalRevenue > 0 ? (totalMarketingCost / totalRevenue) * 100 : 0;
      const contributionMargin = totalRevenue - totalMarketingCost;
      const cm2Percentage = totalRevenue > 0 ? (contributionMargin / totalRevenue) * 100 : 0;

      console.log('=== MARKETING WIDGET FINAL CALCULATION ===');
      console.log('Date Range Used:', marketingDateRange);
      console.log('Meta Cost:', metaCost);
      console.log('Google Cost:', googleCost);
      console.log('Total Marketing Cost:', totalMarketingCost);
      console.log('Total Revenue (from orders):', totalRevenue);
      console.log('Marketing %:', marketingPercentage.toFixed(2) + '%');
      console.log('==========================================');

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

      // Pass data back to parent component
      onMarketingDataUpdate({
        totalMarketingCost,
        totalRevenue,
        blendedRoas,
        marketingPercentage,
        contributionMargin,
        cm2Percentage,
        metaCost,
        googleCost
      });

    } catch (err) {
      setError(err.message);
      setDebug({ error: err.message });
    } finally {
      setLoading(false);
    }
  };

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

  if (loading || ordersOverviewLoading || (!ordersOverview && !error)) {
    return (
      <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl shadow-lg p-8 border border-blue-200">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg shadow-md">
              <FiBarChart className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900">Marketing Overview</h3>
              <p className="text-sm text-gray-600">Loading...</p>
            </div>
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
    <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl shadow-lg p-8 border border-blue-200">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg shadow-md">
            <FiBarChart className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-gray-900">Marketing Overview</h3>
            <p className="text-sm text-gray-600">{getDateRangeLabel()}</p>
          </div>
        </div>
        <Link 
          to="/combined-marketing"
          className="flex items-center space-x-2 px-4 py-2 bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition-all duration-200 shadow-sm border border-blue-200"
        >
          <span className="text-sm font-medium">View Details</span>
          <FiExternalLink className="w-4 h-4" />
        </Link>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Total Marketing Cost */}
        <div className="bg-white rounded-xl p-6 shadow-md border border-red-200 hover:shadow-lg transition-shadow duration-200">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-red-100 rounded-lg">
              <FiDollarSign className="w-5 h-5 text-red-600" />
            </div>
            <div className="text-right">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Marketing Cost</p>
              <p className="text-2xl font-bold text-red-600">{formatCurrency(data.totalMarketingCost)}</p>
            </div>
          </div>
        </div>

        {/* Blended ROAS */}
        <div className="bg-white rounded-xl p-6 shadow-md border border-green-200 hover:shadow-lg transition-shadow duration-200">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-green-100 rounded-lg">
              <FiTrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <div className="text-right">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Blended ROAS</p>
              <p className={`text-2xl font-bold ${
                data.blendedRoas >= 2 ? 'text-green-600' : 
                data.blendedRoas >= 1 ? 'text-yellow-600' : 'text-red-600'
              }`}>
                {data.blendedRoas.toFixed(2)}x
              </p>
            </div>
          </div>
        </div>

        {/* Marketing Percentage */}
        <div className="bg-white rounded-xl p-6 shadow-md border border-orange-200 hover:shadow-lg transition-shadow duration-200">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-orange-100 rounded-lg">
              <FiBarChart className="w-5 h-5 text-orange-600" />
            </div>
            <div className="text-right">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Marketing %</p>
              <p className="text-2xl font-bold text-orange-600">{data.marketingPercentage.toFixed(1)}%</p>
            </div>
          </div>
        </div>

        {/* CM2 Percentage */}
        <div className="bg-white rounded-xl p-6 shadow-md border border-purple-200 hover:shadow-lg transition-shadow duration-200">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-purple-100 rounded-lg">
              <FiTrendingUp className="w-5 h-5 text-purple-600" />
            </div>
            <div className="text-right">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">CM2%</p>
              <p className={`text-2xl font-bold ${
                data.cm2Percentage >= 50 ? 'text-green-600' : 
                data.cm2Percentage >= 30 ? 'text-yellow-600' : 'text-red-600'
              }`}>
                {data.cm2Percentage.toFixed(1)}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Channel Performance and Chart Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Channel Performance Cards */}
        <div className="space-y-4">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Channel Performance</h4>
          
          {/* Meta Ads Card */}
          <div className="bg-white rounded-xl p-6 shadow-md border border-blue-200 hover:shadow-lg transition-shadow duration-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <FaFacebook className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h5 className="font-semibold text-gray-900">Meta Ads</h5>
                  <p className="text-sm text-gray-500">Facebook & Instagram</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold text-gray-900">{formatCurrency(data.metaCost)}</p>
                <p className="text-sm text-gray-500">
                  {data.totalMarketingCost > 0 ? ((data.metaCost / data.totalMarketingCost) * 100).toFixed(1) : 0}% of spend
                </p>
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                style={{ width: `${data.totalMarketingCost > 0 ? (data.metaCost / data.totalMarketingCost) * 100 : 0}%` }}
              ></div>
            </div>
          </div>

          {/* Google Ads Card */}
          <div className="bg-white rounded-xl p-6 shadow-md border border-green-200 hover:shadow-lg transition-shadow duration-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-green-100 rounded-lg">
                  <FaGoogle className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h5 className="font-semibold text-gray-900">Google Ads</h5>
                  <p className="text-sm text-gray-500">Search & Display</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold text-gray-900">{formatCurrency(data.googleCost)}</p>
                <p className="text-sm text-gray-500">
                  {data.totalMarketingCost > 0 ? ((data.googleCost / data.totalMarketingCost) * 100).toFixed(1) : 0}% of spend
                </p>
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-green-600 h-2 rounded-full transition-all duration-300" 
                style={{ width: `${data.totalMarketingCost > 0 ? (data.googleCost / data.totalMarketingCost) * 100 : 0}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Chart Section */}
        <div className="bg-white rounded-xl p-6 shadow-md border border-gray-200">
          <h4 className="text-lg font-semibold text-gray-900 mb-4 text-center">Spend Distribution</h4>
          {prepareChartData() ? (
            <div className="h-48 flex justify-center items-center">
              <Pie 
                data={prepareChartData()} 
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'bottom',
                      labels: {
                        usePointStyle: true,
                        pointStyle: 'circle',
                        padding: 20,
                        font: {
                          size: 12,
                          weight: '500'
                        }
                      }
                    },
                    tooltip: {
                      backgroundColor: 'rgba(0, 0, 0, 0.8)',
                      titleColor: '#fff',
                      bodyColor: '#fff',
                      borderColor: 'rgba(59, 130, 246, 1)',
                      borderWidth: 1,
                      cornerRadius: 8,
                      callbacks: {
                        label: function(context) {
                          const percentage = ((context.raw / data.totalMarketingCost) * 100).toFixed(1);
                          return `${context.label}: ${formatCurrency(context.raw)} (${percentage}%)`;
                        }
                      }
                    }
                  }
                }}
              />
            </div>
          ) : (
            <div className="h-48 flex items-center justify-center text-gray-500">
              <p>No data available</p>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        {/* Contribution Margin */}
        <div className="bg-white rounded-xl p-6 shadow-md border border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`p-3 rounded-lg ${data.contributionMargin >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
                <FiTrendingUp className={`w-5 h-5 ${data.contributionMargin >= 0 ? 'text-green-600' : 'text-red-600'}`} />
              </div>
              <div>
                <h5 className="font-semibold text-gray-900">Contribution Margin</h5>
                <p className="text-sm text-gray-500">Revenue - Marketing Cost</p>
              </div>
            </div>
            <p className={`text-xl font-bold ${
              data.contributionMargin >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {formatCurrency(data.contributionMargin)}
            </p>
          </div>
        </div>

        {/* Total Revenue */}
        <div className="bg-white rounded-xl p-6 shadow-md border border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-indigo-100 rounded-lg">
                <FiDollarSign className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <h5 className="font-semibold text-gray-900">Total Revenue</h5>
                <p className="text-sm text-gray-500">For selected period</p>
              </div>
            </div>
            <p className="text-xl font-bold text-indigo-600">{formatCurrency(data.totalRevenue)}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CombinedMarketingWidget;