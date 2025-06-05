import React, { useState, useEffect } from 'react';
import { Bar, Line, Pie } from 'react-chartjs-2';
import { 
  FiDollarSign, 
  FiTrendingUp,
  FiTrendingDown,
  FiRefreshCw,
  FiTarget,
  FiBarChart,
  FiPieChart
} from 'react-icons/fi';
import { FaGoogle, FaFacebook } from 'react-icons/fa';
import { formatCurrency, formatNumber } from '../../utils/formatters';
import * as metaAdsAPI from '../../api/metaAdsAPI';
import * as googleAdsAPI from '../../api/googleAdsAPI';
import * as ordersAPI from '../../api/ordersAPI';

const CombinedMarketingAnalytics = ({ dateRange = 'last_30_days' }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [debug, setDebug] = useState(null);
  const [marketingData, setMarketingData] = useState({
    metaAds: null,
    googleAds: null,
    orders: null,
    combined: null
  });

  const fetchMarketingData = async () => {
    try {
      setLoading(true);
      setError(null);
      setDebug(null);

      const queryParams = { dateRange };

      // Fetch data from all sources with detailed error handling
      const results = await Promise.allSettled([
        metaAdsAPI.getSummary(queryParams),
        googleAdsAPI.getSummary(queryParams),
        ordersAPI.getOrdersOverview(getDateRangeForOrders(dateRange)).catch(() => {
          // Return a default orders object if API fails
          return { data: { total_revenue: 0, totalValue: 0 } };
        })
      ]);

      // Process results and collect debug info
      const debugInfo = {
        metaAds: { status: results[0].status, data: null, error: null },
        googleAds: { status: results[1].status, data: null, error: null },
        orders: { status: results[2].status, data: null, error: null }
      };

      let metaAdsData = null;
      let googleAdsData = null;
      let ordersData = null;

      // Meta Ads result
      if (results[0].status === 'fulfilled') {
        metaAdsData = results[0].value?.data;
        debugInfo.metaAds.data = metaAdsData;
        debugInfo.metaAds.message = results[0].value?.message;
      } else {
        debugInfo.metaAds.error = results[0].reason?.message || 'Unknown error';
      }

      // Google Ads result
      if (results[1].status === 'fulfilled') {
        googleAdsData = results[1].value?.data;
        debugInfo.googleAds.data = googleAdsData;
        debugInfo.googleAds.message = results[1].value?.message;
        debugInfo.googleAds.tokenStatus = results[1].value?.tokenStatus;
      } else {
        debugInfo.googleAds.error = results[1].reason?.message || 'Unknown error';
      }

      // Orders result
      if (results[2].status === 'fulfilled') {
        ordersData = results[2].value?.data;
        debugInfo.orders.data = ordersData;
      } else {
        debugInfo.orders.error = results[2].reason?.message || 'Unknown error';
      }

      setDebug(debugInfo);

      // Calculate combined metrics
      const combined = calculateCombinedMetrics(
        metaAdsData,
        googleAdsData,
        ordersData
      );

      setMarketingData({
        metaAds: metaAdsData,
        googleAds: googleAdsData,
        orders: ordersData,
        combined
      });

    } catch (err) {
      setError(err.message);
      setDebug({ error: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMarketingData();
  }, [dateRange]);

  // Convert marketing date range to orders API format
  const getDateRangeForOrders = (marketingDateRange) => {
    const now = new Date();
    let startDate, endDate = now;

    switch (marketingDateRange) {
      case 'today':
        startDate = new Date(now);
        break;
      case 'yesterday':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 1);
        endDate = new Date(now);
        endDate.setDate(now.getDate() - 1);
        break;
      case 'last_7_days':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
        break;
      case 'last_30_days':
      default:
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 30);
        break;
      case 'this_month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
    }

    return {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString()
    };
  };

  // Calculate combined marketing metrics
  const calculateCombinedMetrics = (metaData, googleData, ordersData) => {
    // Map Meta Ads fields (uses 'spend' field)
    const metaCost = metaData?.spend || metaData?.cost || 0;
    const metaConversions = metaData?.total_purchases || metaData?.purchase_count || metaData?.conversions || 0;
    const metaConversionValue = metaData?.total_purchase_value || metaData?.conversion_value || 0;
    
    // Map Google Ads fields (uses 'cost' field)
    const googleCost = googleData?.cost || 0;
    const googleConversions = googleData?.conversions || 0;
    const googleConversionValue = googleData?.conversion_value || 0;
    
    // Total marketing costs
    const totalMarketingCost = metaCost + googleCost;
    
    // Use ACTUAL SHOPIFY REVENUE, but fallback to conversion values if orders API fails  
    let totalRevenue = ordersData?.total_revenue || 0;
    
    // Fallback to conversion values if orders API completely failed
    if (totalRevenue === 0 && !ordersData?.total_revenue) {
      totalRevenue = metaConversionValue + googleConversionValue;
      console.log('⚠️  Orders API failed, using conversion values as fallback:', totalRevenue);
    }
    
    // Marketing percentage of revenue
    const marketingPercentage = totalRevenue > 0 ? (totalMarketingCost / totalRevenue) * 100 : 0;
    
    // Contribution Margin (Revenue - Marketing Cost)
    const contributionMargin = totalRevenue - totalMarketingCost;
    
    // CM2% (Contribution Margin as percentage of revenue)
    const cm2Percentage = totalRevenue > 0 ? (contributionMargin / totalRevenue) * 100 : 0;
    
    // Individual ROAS
    const metaRoas = metaCost > 0 ? metaConversionValue / metaCost : 0;
    const googleRoas = googleCost > 0 ? googleConversionValue / googleCost : 0;
    
    // Blended ROAS (Total Revenue / Total Marketing Cost)
    const blendedRoas = totalMarketingCost > 0 ? totalRevenue / totalMarketingCost : 0;
    
    // Total conversions
    const totalConversions = metaConversions + googleConversions;
    
    // Average CPA (Cost Per Acquisition)
    const averageCpa = totalConversions > 0 ? totalMarketingCost / totalConversions : 0;
    
    console.log('=== COMBINED MARKETING ANALYTICS DEBUG ===');
    console.log('Meta Cost:', metaCost);
    console.log('Google Cost:', googleCost);
    console.log('Total Marketing Cost:', totalMarketingCost);
    console.log('SHOPIFY Revenue:', ordersData?.total_revenue);
    console.log('Meta Conversion Value (not used for %):', metaConversionValue);
    console.log('Google Conversion Value (not used for %):', googleConversionValue);
    console.log('Final Revenue for %:', totalRevenue);
    console.log('Marketing %:', marketingPercentage.toFixed(2) + '%');
    console.log('==========================================');
    
    return {
      totalMarketingCost,
      totalRevenue,
      marketingPercentage,
      contributionMargin,
      cm2Percentage,
      metaRoas,
      googleRoas,
      blendedRoas,
      totalConversions,
      averageCpa,
      channelBreakdown: {
        meta: {
          cost: metaCost,
          percentage: totalMarketingCost > 0 ? (metaCost / totalMarketingCost) * 100 : 0,
          conversions: metaConversions,
          conversionValue: metaConversionValue,
          roas: metaRoas
        },
        google: {
          cost: googleCost,
          percentage: totalMarketingCost > 0 ? (googleCost / totalMarketingCost) * 100 : 0,
          conversions: googleConversions,
          conversionValue: googleConversionValue,
          roas: googleRoas
        }
      }
    };
  };

  const MetricCard = ({ title, value, icon: Icon, color = '#4285f4', change, prefix = '', suffix = '', description }) => (
    <div className="bg-white p-6 rounded-lg shadow-md border-l-4" style={{ borderLeftColor: color }}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">
            {prefix}{typeof value === 'number' ? formatNumber(value) : value}{suffix}
          </p>
          {description && (
            <p className="text-xs text-gray-500 mt-1">{description}</p>
          )}
          {change !== undefined && (
            <div className={`flex items-center mt-2 ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {change >= 0 ? <FiTrendingUp className="w-4 h-4 mr-1" /> : <FiTrendingDown className="w-4 h-4 mr-1" />}
              <span className="text-sm font-medium">{Math.abs(change).toFixed(1)}%</span>
            </div>
          )}
        </div>
        <div className="p-3 rounded-full ml-4" style={{ backgroundColor: `${color}20` }}>
          <Icon className="w-6 h-6" style={{ color }} />
        </div>
      </div>
    </div>
  );

  // Prepare channel breakdown chart
  const prepareChannelBreakdownChart = () => {
    if (!marketingData.combined) return null;

    const { channelBreakdown } = marketingData.combined;
    
    return {
      labels: ['Meta Ads', 'Google Ads'],
      datasets: [{
        label: 'Marketing Spend',
        data: [channelBreakdown.meta.cost, channelBreakdown.google.cost],
        backgroundColor: ['rgba(24, 119, 242, 0.8)', 'rgba(52, 168, 83, 0.8)'],
        borderColor: ['rgba(24, 119, 242, 1)', 'rgba(52, 168, 83, 1)'],
        borderWidth: 1
      }]
    };
  };

  // Prepare ROAS comparison chart
  const prepareRoasChart = () => {
    if (!marketingData.combined) return null;

    const { channelBreakdown, blendedRoas } = marketingData.combined;
    
    return {
      labels: ['Meta Ads', 'Google Ads', 'Blended'],
      datasets: [{
        label: 'ROAS',
        data: [channelBreakdown.meta.roas, channelBreakdown.google.roas, blendedRoas],
        backgroundColor: ['rgba(24, 119, 242, 0.6)', 'rgba(52, 168, 83, 0.6)', 'rgba(255, 193, 7, 0.6)'],
        borderColor: ['rgba(24, 119, 242, 1)', 'rgba(52, 168, 83, 1)', 'rgba(255, 193, 7, 1)'],
        borderWidth: 2
      }]
    };
  };

  // Add Debug Info Component
  const DebugInfo = () => {
    if (!debug) return null;

    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
        <h4 className="text-sm font-semibold text-gray-700 mb-3">Debug Information</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div>
            <strong>Meta Ads:</strong>
            <div className={`p-2 rounded ${debug.metaAds.status === 'fulfilled' ? 'bg-green-100' : 'bg-red-100'}`}>
              <div>Status: {debug.metaAds.status}</div>
              {debug.metaAds.error && <div>Error: {debug.metaAds.error}</div>}
              {debug.metaAds.message && <div>Message: {debug.metaAds.message}</div>}
              {debug.metaAds.data && <div>Cost: ₹{debug.metaAds.data.spend || debug.metaAds.data.cost || 0}</div>}
            </div>
          </div>
          <div>
            <strong>Google Ads:</strong>
            <div className={`p-2 rounded ${debug.googleAds.status === 'fulfilled' ? 'bg-green-100' : 'bg-red-100'}`}>
              <div>Status: {debug.googleAds.status}</div>
              {debug.googleAds.error && <div>Error: {debug.googleAds.error}</div>}
              {debug.googleAds.message && <div>Message: {debug.googleAds.message}</div>}
              {debug.googleAds.tokenStatus && <div>Token: {debug.googleAds.tokenStatus}</div>}
              {debug.googleAds.data && <div>Cost: ₹{debug.googleAds.data.cost || 0}</div>}
            </div>
          </div>
          <div>
            <strong>Orders:</strong>
            <div className={`p-2 rounded ${debug.orders.status === 'fulfilled' ? 'bg-green-100' : 'bg-red-100'}`}>
              <div>Status: {debug.orders.status}</div>
              {debug.orders.error && <div>Error: {debug.orders.error}</div>}
              {debug.orders.data && <div>Revenue: ₹{debug.orders.data.total_revenue || debug.orders.data.totalValue || 0}</div>}
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
        <strong>Error:</strong> {error}
      </div>
    );
  }

  if (loading || !marketingData.combined) {
    return (
      <div className="flex justify-center items-center py-12">
        <FiRefreshCw className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Loading marketing analytics...</span>
      </div>
    );
  }

  const { combined } = marketingData;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <FiBarChart className="w-8 h-8 text-blue-600" />
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Combined Marketing Analytics</h2>
              <p className="text-gray-600">Unified view of Meta Ads and Google Ads performance</p>
            </div>
          </div>
          <button
            onClick={fetchMarketingData}
            disabled={loading}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            <FiRefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Debug Information */}
      <DebugInfo />

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <MetricCard
          title="Total Marketing Cost"
          value={combined.totalMarketingCost}
          icon={FiDollarSign}
          color="#e74c3c"
          prefix="₹"
          description="Combined spend across all channels"
        />
        
        <MetricCard
          title="Marketing %"
          value={combined.marketingPercentage.toFixed(1)}
          icon={FiPieChart}
          color="#f39c12"
          suffix="%"
          description="Marketing cost as % of revenue"
        />
        
        <MetricCard
          title="Contribution Margin"
          value={combined.contributionMargin}
          icon={FiTrendingUp}
          color="#27ae60"
          prefix="₹"
          description="Revenue minus marketing cost"
        />
        
        <MetricCard
          title="CM2%"
          value={combined.cm2Percentage.toFixed(1)}
          icon={FiTarget}
          color="#8e44ad"
          suffix="%"
          description="Contribution margin as % of revenue"
        />
        
        <MetricCard
          title="Blended ROAS"
          value={combined.blendedRoas.toFixed(2)}
          icon={FiTrendingUp}
          color="#3498db"
          suffix="x"
          description="Total revenue / total marketing cost"
        />
        
        <MetricCard
          title="Average CPA"
          value={combined.averageCpa}
          icon={FiDollarSign}
          color="#9b59b6"
          prefix="₹"
          description="Cost per acquisition across channels"
        />
      </div>

      {/* Individual Channel ROAS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <MetricCard
          title="Meta Ads ROAS"
          value={combined.metaRoas.toFixed(2)}
          icon={FaFacebook}
          color="#1877f2"
          suffix="x"
          description={`₹${formatNumber(combined.channelBreakdown.meta.cost)} spend`}
        />
        
        <MetricCard
          title="Google Ads ROAS"
          value={combined.googleRoas.toFixed(2)}
          icon={FaGoogle}
          color="#34a853"
          suffix="x"
          description={`₹${formatNumber(combined.channelBreakdown.google.cost)} spend`}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Channel Breakdown */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Marketing Spend by Channel</h3>
          <div className="h-80">
            {prepareChannelBreakdownChart() && (
              <Pie 
                data={prepareChannelBreakdownChart()} 
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'bottom',
                    },
                    tooltip: {
                      callbacks: {
                        label: function(context) {
                          const percentage = combined.channelBreakdown[context.dataIndex === 0 ? 'meta' : 'google'].percentage;
                          return `${context.label}: ₹${formatNumber(context.raw)} (${percentage.toFixed(1)}%)`;
                        }
                      }
                    }
                  }
                }}
              />
            )}
          </div>
        </div>

        {/* ROAS Comparison */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">ROAS Comparison</h3>
          <div className="h-80">
            {prepareRoasChart() && (
              <Bar 
                data={prepareRoasChart()} 
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
                          return `ROAS: ${context.raw.toFixed(2)}x`;
                        }
                      }
                    }
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      title: {
                        display: true,
                        text: 'ROAS (x)'
                      }
                    }
                  }
                }}
              />
            )}
          </div>
        </div>
      </div>

      {/* Channel Performance Summary */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Channel Performance Summary</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Channel</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Spend</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">% of Total</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Conversions</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ROAS</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 flex items-center">
                  <FaFacebook className="w-4 h-4 mr-2 text-blue-600" />
                  Meta Ads
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  ₹{formatNumber(combined.channelBreakdown.meta.cost)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {combined.channelBreakdown.meta.percentage.toFixed(1)}%
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {formatNumber(combined.channelBreakdown.meta.conversions)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  ₹{formatNumber(combined.channelBreakdown.meta.conversionValue)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    combined.channelBreakdown.meta.roas >= 2 
                      ? 'bg-green-100 text-green-800' 
                      : combined.channelBreakdown.meta.roas >= 1 
                        ? 'bg-yellow-100 text-yellow-800' 
                        : 'bg-red-100 text-red-800'
                  }`}>
                    {combined.channelBreakdown.meta.roas.toFixed(2)}x
                  </span>
                </td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 flex items-center">
                  <FaGoogle className="w-4 h-4 mr-2 text-green-600" />
                  Google Ads
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  ₹{formatNumber(combined.channelBreakdown.google.cost)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {combined.channelBreakdown.google.percentage.toFixed(1)}%
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {formatNumber(combined.channelBreakdown.google.conversions)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  ₹{formatNumber(combined.channelBreakdown.google.conversionValue)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    combined.channelBreakdown.google.roas >= 2 
                      ? 'bg-green-100 text-green-800' 
                      : combined.channelBreakdown.google.roas >= 1 
                        ? 'bg-yellow-100 text-yellow-800' 
                        : 'bg-red-100 text-red-800'
                  }`}>
                    {combined.channelBreakdown.google.roas.toFixed(2)}x
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CombinedMarketingAnalytics; 