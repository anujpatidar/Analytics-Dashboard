import React, { useState, useEffect } from 'react';
import { Bar } from 'react-chartjs-2';
import { 
  FiDollarSign, 
  FiEye, 
  FiMousePointer,
  FiRefreshCw,
  FiTrendingUp,
  FiExternalLink,
  FiShoppingCart
} from 'react-icons/fi';
import { FaGoogle } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import { formatNumber } from '../../utils/formatters';
import * as googleAdsAPI from '../../api/googleAdsAPI';

const GoogleAdsDashboardWidget = () => {
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState(null);
  const [campaigns, setCampaigns] = useState([]);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const [summaryResponse, campaignResponse] = await Promise.all([
        googleAdsAPI.getSummary({ dateRange: 'last_7_days' }),
        googleAdsAPI.getCampaigns({ dateRange: 'last_7_days' })
      ]);

      setSummary(summaryResponse.data);
      setCampaigns(campaignResponse.data);
    } catch (err) {
      setError('Failed to fetch Google Ads data');
      console.error('Google Ads fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Prepare chart data for top 5 campaigns by cost
  const prepareChartData = () => {
    if (!campaigns.length) return null;

    const topCampaigns = [...campaigns]
      .sort((a, b) => b.cost - a.cost)
      .slice(0, 5);

    return {
      labels: topCampaigns.map(c => (c.campaign_name || c.campaign_id).substring(0, 15) + '...'),
      datasets: [{
        label: 'Cost (₹)',
        data: topCampaigns.map(c => c.cost),
        backgroundColor: 'rgba(52, 168, 83, 0.5)',
        borderColor: 'rgba(52, 168, 83, 1)',
        borderWidth: 1
      }]
    };
  };

  const StatItem = ({ icon: Icon, label, value, color = '#34a853' }) => (
    <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
      <div className="p-2 rounded-full" style={{ backgroundColor: `${color}20` }}>
        <Icon className="w-4 h-4" style={{ color }} />
      </div>
      <div>
        <p className="text-xs text-gray-600">{label}</p>
        <p className="text-sm font-semibold text-gray-900">{value}</p>
      </div>
    </div>
  );

  if (error) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <FaGoogle className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">Google Ads</h3>
          </div>
          <Link 
            to="/google-ads" 
            className="text-blue-600 hover:text-blue-800 flex items-center space-x-1"
          >
            <span className="text-sm">View Details</span>
            <FiExternalLink className="w-4 h-4" />
          </Link>
        </div>
        <div className="text-center py-8">
          <p className="text-red-600 text-sm">{error}</p>
          <button 
            onClick={fetchData}
            className="mt-2 text-blue-600 hover:text-blue-800 text-sm"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <FaGoogle className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">Google Ads</h3>
          <span className="text-xs text-gray-500">(Last 7 days)</span>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={fetchData}
            disabled={loading}
            className="p-1 text-gray-400 hover:text-gray-600"
          >
            <FiRefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <Link 
            to="/google-ads" 
            className="text-blue-600 hover:text-blue-800 flex items-center space-x-1"
          >
            <span className="text-sm">View Details</span>
            <FiExternalLink className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-8">
          <FiRefreshCw className="w-6 h-6 animate-spin text-blue-600" />
          <span className="ml-2 text-gray-600">Loading...</span>
        </div>
      ) : summary ? (
        <div className="space-y-4">
          {/* Key Metrics */}
          <div className="grid grid-cols-2 gap-3">
            <StatItem
              icon={FiDollarSign}
              label="Total Cost"
              value={`₹${formatNumber(summary.cost)}`}
              color="#ea4335"
            />
            <StatItem
              icon={FiEye}
              label="Impressions"
              value={formatNumber(summary.impressions)}
              color="#4285f4"
            />
            <StatItem
              icon={FiMousePointer}
              label="Clicks"
              value={formatNumber(summary.clicks)}
              color="#34a853"
            />
            <StatItem
              icon={FiShoppingCart}
              label="Conversions"
              value={summary.conversions?.toFixed(1) || 0}
              color="#fbbc04"
            />
          </div>

          {/* Performance Metrics */}
          <div className="grid grid-cols-3 gap-3 pt-2 border-t border-gray-200">
            <div className="text-center">
              <p className="text-xs text-gray-600">CTR</p>
              <p className="text-sm font-semibold text-gray-900">
                {summary.ctr?.toFixed(2)}%
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-600">CPC</p>
              <p className="text-sm font-semibold text-gray-900">
                ₹{summary.cpc?.toFixed(2)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-600">ROAS</p>
              <p className={`text-sm font-semibold ${
                summary.roas >= 2 
                  ? 'text-green-600' 
                  : summary.roas >= 1 
                    ? 'text-yellow-600' 
                    : 'text-red-600'
              }`}>
                {summary.roas?.toFixed(2)}x
              </p>
            </div>
          </div>

          {/* Top Campaigns Chart */}
          {campaigns.length > 0 && (
            <div className="pt-4 border-t border-gray-200">
              <h4 className="text-sm font-medium text-gray-900 mb-3">Top Campaigns by Cost</h4>
              <div className="h-32">
                <Bar 
                  data={prepareChartData()} 
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: { display: false }
                    },
                    scales: {
                      x: {
                        display: false
                      },
                      y: {
                        display: false
                      }
                    }
                  }}
                />
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-gray-500 text-sm">No Google Ads data available</p>
        </div>
      )}
    </div>
  );
};

export default GoogleAdsDashboardWidget; 