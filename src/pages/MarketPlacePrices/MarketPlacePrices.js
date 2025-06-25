// 1. Average Shopify Price (Low to High) – shopify-asc
// Sorts products in ascending order based on the average Shopify price across all their variants.

// 2. Average Shopify Price (High to Low) – shopify-desc
// Sorts products in descending order based on the average Shopify price.

// 3. Amazon - Shopify Price Difference (Descending) – amazon-shopify-diff
// Calculates the average price on Amazon minus average Shopify price.

// Sorts in descending order: products where Amazon is much higher than Shopify appear first.

// 4. Shopify - Amazon Price Difference (Descending) – shopify-amazon-diff
// Calculates the average Shopify price minus average Amazon price.

// Sorts in descending order: products where Shopify is overpriced vs Amazon show up first.

// 5. Max Variant Price Difference (Descending) – max-diff
// Calculates the largest price gap between any two platforms (Amazon, Shopify, Flipkart) across all variants in a product.

// Highlights products with inconsistent or volatile pricing across marketplaces.

// 6. Product Name A–Z (Default) – name
// Alphabetical sort by product title.
import React, { useState, useEffect, useMemo } from 'react';
import { ChevronDown, ChevronUp, ArrowUpDown, DollarSign, Tag, Filter, SortAsc, AlertCircle, ChevronsUp, ChevronsDown, Download } from 'lucide-react';
import { FaRupeeSign } from 'react-icons/fa';
import { 
  FiRefreshCw, 
  FiDownload, 
  FiFilter,
  FiCalendar,
  FiPackage,
  FiPercent,
  FiTrendingUp,
  FiTrendingDown,
  FiTarget
} from 'react-icons/fi';
import { 
  HiShoppingCart,
  HiCash,
  HiChartBar
} from 'react-icons/hi';
import styled from 'styled-components';
import axios from 'axios';
import { formatCurrency } from '../../utils/formatters';

// Modern Dashboard Container - matching DashboardPage design
const ModernContainer = styled.div`
  min-height: 100vh;
  padding: 1rem;
  background: #f8fafc;
  
  @media (max-width: 768px) {
    padding: 0.5rem;
  }
`;

const ModernContent = styled.div`
  max-width: 1400px;
  margin: 0 auto;
`;

// Modern Header Section
const ModernHeaderSection = styled.div`
  background: rgba(255, 255, 255, 0.98);
  backdrop-filter: blur(20px);
  border-radius: 16px;
  padding: 1rem 1.5rem;
  margin-bottom: 1rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.3);
  position: relative;
  z-index: 1000;
  
  @media (max-width: 768px) {
    padding: 0.75rem 1rem;
    margin-bottom: 0.75rem;
  }
`;

const ModernHeaderContent = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  
  @media (max-width: 768px) {
    flex-direction: column;
    gap: 0.75rem;
  }
`;

const ModernHeaderLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  flex: 1;
`;

const ModernHeaderTitle = styled.div`
  h1 {
    font-size: 1.5rem;
    font-weight: 700;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    margin: 0;
    line-height: 1.2;
  }
  
  p {
    color: #64748b;
    margin: 0;
    font-size: 0.75rem;
    margin-top: 0.125rem;
  }
  
  @media (max-width: 768px) {
    h1 {
      font-size: 1.25rem;
    }
    p {
      font-size: 0.7rem;
    }
  }
`;

const ModernStatsQuickView = styled.div`
  display: flex;
  gap: 1rem;
  align-items: center;
  
  @media (max-width: 968px) {
    display: none;
  }
`;

const ModernQuickStat = styled.div`
  text-align: center;
  padding: 0.5rem 0.75rem;
  background: rgba(102, 126, 234, 0.08);
  border-radius: 8px;
  min-width: 80px;
  
  .label {
    font-size: 0.65rem;
    color: #64748b;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  
  .value {
    font-size: 0.9rem;
    font-weight: 700;
    color: #1e293b;
    margin-top: 0.125rem;
  }
`;

const ModernHeaderActions = styled.div`
  display: flex;
  gap: 0.5rem;
  align-items: center;
  
  @media (max-width: 768px) {
    width: 100%;
    justify-content: center;
  }
`;

const ModernActionButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.5rem 0.75rem;
  border: none;
  border-radius: 10px;
  font-weight: 500;
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &.primary {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    
    &:hover {
      transform: translateY(-1px);
      box-shadow: 0 3px 10px rgba(102, 126, 234, 0.4);
    }
  }
  
  &.secondary {
    background: rgba(255, 255, 255, 0.9);
    color: #64748b;
    border: 1px solid rgba(0, 0, 0, 0.1);
    
    &:hover {
      background: white;
      color: #374151;
      border-color: rgba(0, 0, 0, 0.2);
    }
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
`;

// Modern Controls Section
const ModernControlsSection = styled.div`
  background: rgba(255, 255, 255, 0.12);
  border-radius: 12px;
  padding: 1rem 1.25rem;
  backdrop-filter: blur(10px);
  position: relative;
  z-index: 1001;
  margin-top: 0.75rem;
  
  .controls-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    
    @media (max-width: 768px) {
      flex-direction: column;
      gap: 0.75rem;
    }
  }
  
  .controls-info {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    
    .icon-wrapper {
      width: 32px;
      height: 32px;
      background: rgba(102, 126, 234, 0.2);
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #667eea;
    }
    
    .controls-text {
      h3 {
        color: #1e293b;
        font-size: 0.875rem;
        font-weight: 600;
        margin: 0;
        margin-bottom: 0.125rem;
      }
      
      p {
        color: #64748b;
        font-size: 0.75rem;
        margin: 0;
      }
    }
  }
  
  .controls-actions {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    
    @media (max-width: 768px) {
      width: 100%;
      justify-content: center;
      flex-wrap: wrap;
    }
  }
`;

const ModernSelectButton = styled.select`
  background: rgba(255, 255, 255, 0.9);
  color: #374151;
  border: 1px solid rgba(0, 0, 0, 0.1);
  padding: 0.375rem 0.75rem;
  border-radius: 8px;
  font-size: 0.75rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: white;
    border-color: rgba(0, 0, 0, 0.2);
  }
  
  &:focus {
    outline: none;
    border-color: #667eea;
    box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.1);
  }
`;

// Modern Section Cards
const ModernSectionCard = styled.div`
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 20px;
  margin-bottom: 1.5rem;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  overflow: hidden;
`;

const ModernSectionHeader = styled.div`
  padding: 1.5rem 2rem 1rem;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  
  h2 {
    font-size: 1.25rem;
    font-weight: 700;
    color: #1e293b;
    margin: 0;
    margin-bottom: 0.25rem;
  }
  
  p {
    font-size: 0.875rem;
    color: #64748b;
    margin: 0;
  }
`;

const ModernSectionContent = styled.div`
  padding: 1.5rem 2rem 2rem;
`;

// Modern Table Styles
const ModernTable = styled.div`
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  border: 1px solid rgba(0, 0, 0, 0.04);
`;

const TableHeader = styled.div`
  background: #f8fafc;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  font-weight: 600;
  color: #374151;
  font-size: 0.875rem;
`;

const TableRow = styled.div`
  padding: 1rem 1.5rem;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  transition: all 0.2s ease;
  cursor: pointer;
  
  &:hover {
    background: #f8fafc;
  }
  
  &:last-child {
    border-bottom: none;
  }
`;

const ProductCard = styled.div`
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 1rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  border: 1px solid rgba(0, 0, 0, 0.04);
  transition: all 0.2s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    border-color: rgba(102, 126, 234, 0.2);
  }
`;

const MarketPlacePrices = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedProducts, setExpandedProducts] = useState({});
  const [sortOption, setSortOption] = useState('name');
  const [filterOption, setFilterOption] = useState('all');
  
  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(process.env.REACT_APP_ENVIRONMENT==='development' ? 'http://localhost:8080/api/v1/get-marketplace-prices' : 'https://rapi.myfrido.com/api/v1/get-marketplace-prices');
      if (response.data.success) {
        setProducts(response.data.data);
      } else {
        setError('Failed to fetch products');
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch products');
    } finally {
      setLoading(false);
    }
  };

  // Compute product metrics
  const productMetrics = useMemo(() => {
    return products.map(product => {
      const metrics = {
        product_id: product.product_id,
        title: product.title,
        variants: product.variants,
        avgShopifyPrice: 0,
        avgAmazonPrice: 0,
        avgFlipkartPrice: 0,
        maxPriceDifference: 0,
        amazonShopifyDiff: 0,
        shopifyAmazonDiff: 0,
        hasAmazonHigher: false,
        hasShopifyHigher: false
      };

      let shopifyCount = 0, amazonCount = 0, flipkartCount = 0;
      let shopifySum = 0, amazonSum = 0, flipkartSum = 0;

      product.variants.forEach(variant => {
        const { prices } = variant;
        
        // Calculate averages
        if (prices.shopify !== null) {
          shopifySum += prices.shopify;
          shopifyCount++;
        }
        if (prices.amazon !== null) {
          amazonSum += prices.amazon;
          amazonCount++;
        }
        if (prices.flipkart !== null) {
          flipkartSum += prices.flipkart;
          flipkartCount++;
        }

        // Check price differences
        if (prices.amazon !== null && prices.shopify !== null) {
          const diff = prices.amazon - prices.shopify;
          if (diff > 0) metrics.hasAmazonHigher = true;
          if (diff < 0) metrics.hasShopifyHigher = true;
        }

        // Calculate max price difference for this variant
        const validPrices = [prices.amazon, prices.shopify, prices.flipkart].filter(p => p !== null);
        if (validPrices.length > 1) {
          const maxDiff = Math.max(...validPrices) - Math.min(...validPrices);
          metrics.maxPriceDifference = Math.max(metrics.maxPriceDifference, maxDiff);
        }
      });

      // Calculate averages
      metrics.avgShopifyPrice = shopifyCount ? shopifySum / shopifyCount : 0;
      metrics.avgAmazonPrice = amazonCount ? amazonSum / amazonCount : 0;
      metrics.avgFlipkartPrice = flipkartCount ? flipkartSum / flipkartCount : 0;

      // Calculate price differences
      metrics.amazonShopifyDiff = metrics.avgAmazonPrice - metrics.avgShopifyPrice;
      metrics.shopifyAmazonDiff = metrics.avgShopifyPrice - metrics.avgAmazonPrice;

      return metrics;
    });
  }, [products]);

  // Sort and filter products
  const processedProducts = useMemo(() => {
    let result = [...productMetrics];

    // Apply filters
    switch (filterOption) {
      case 'amazon-higher':
        result = result.filter(p => p.hasAmazonHigher);
        break;
      case 'shopify-higher':
        result = result.filter(p => p.hasShopifyHigher);
        break;
      default:
        break;
    }

    // Apply sorting
    switch (sortOption) {
      case 'shopify-asc':
        result.sort((a, b) => a.avgShopifyPrice - b.avgShopifyPrice);
        break;
      case 'shopify-desc':
        result.sort((a, b) => b.avgShopifyPrice - a.avgShopifyPrice);
        break;
      case 'amazon-shopify-diff':
        result.sort((a, b) => b.amazonShopifyDiff - a.amazonShopifyDiff);
        break;
      case 'shopify-amazon-diff':
        result.sort((a, b) => b.shopifyAmazonDiff - a.shopifyAmazonDiff);
        break;
      case 'max-diff':
        result.sort((a, b) => b.maxPriceDifference - a.maxPriceDifference);
        break;
      case 'name':
      default:
        result.sort((a, b) => a.title.localeCompare(b.title));
        break;
    }

    return result;
  }, [productMetrics, sortOption, filterOption]);
  
  // Function to toggle product expansion
  const toggleProductExpansion = (productId) => {
    setExpandedProducts(prev => ({
      ...prev,
      [productId]: !prev[productId]
    }));
  };
  
  // Function to determine the lowest price platform
  const getLowestPrice = (prices) => {
    if (!prices) return null;
    
    const platforms = Object.entries(prices)
      .filter(([_, price]) => price !== null)
      .map(([platform]) => platform);
    
    if (platforms.length === 0) return null;
    
    // Check if all prices are equal
    const uniquePrices = new Set(Object.values(prices).filter(price => price !== null));
    if (uniquePrices.size === 1) {
      return { platform: 'Equal', price: Array.from(uniquePrices)[0] };
    }
    
    let lowestPlatform = platforms[0];
    
    platforms.forEach(platform => {
      if (prices[platform] < prices[lowestPlatform]) {
        lowestPlatform = platform;
      }
    });
    
    return { platform: lowestPlatform, price: prices[lowestPlatform] };
  };

  // Function to handle expand/collapse all
  const handleToggleAll = () => {
    // Check if all items are currently expanded
    const allExpanded = products.every(product => expandedProducts[product.product_id]);
    
    // Create new state with all items either expanded or collapsed
    const newExpandedState = {};
    products.forEach(product => {
      newExpandedState[product.product_id] = !allExpanded;
    });
    setExpandedProducts(newExpandedState);
  };

  // Function to count variants with higher Shopify prices
  const countHigherShopifyVariants = (variants) => {
    return variants.filter(variant => {
      const { prices } = variant;
      return prices.shopify !== null && prices.amazon !== null && prices.shopify > prices.amazon;
    }).length;
  };

  // Function to count variants with significant price difference (> ₹1)
  const countSignificantPriceDifference = (variants) => {
    return variants.filter(variant => {
      const { prices } = variant;
      return prices.shopify !== null && prices.amazon !== null && (prices.shopify - prices.amazon) > 1;
    }).length;
  };

  // Function to download CSV
  const downloadCSV = () => {
    // Create CSV header
    const headers = ['Title', 'Variant ID', 'SKU Code', 'Amazon Price', 'Shopify Price'];
    
    // Create CSV rows
    const rows = products.flatMap(product => 
      product.variants.map(variant => [
        product.title,
        variant.variant_id,
        variant.sku,
        variant.prices.amazon || 'N/A',
        variant.prices.shopify || 'N/A'
      ])
    );

    // Combine headers and rows
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    // Create and trigger download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'marketplace_prices.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-6 bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading products...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto p-6 bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 max-w-md text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-red-800 mb-2">Error Loading Products</h3>
          <p className="text-red-600 mb-4">{error}</p>
          <button 
            onClick={fetchProducts}
            className="bg-red-100 text-red-700 px-4 py-2 rounded-lg hover:bg-red-200 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <ModernContainer>
      <ModernContent>
        {/* Modern Header */}
        <ModernHeaderSection>
          <ModernHeaderContent>
            <ModernHeaderLeft>
              <ModernHeaderTitle>
                <h1>Marketplace Prices</h1>
                <p>Compare product prices across different marketplaces and platforms</p>
              </ModernHeaderTitle>
              
              <ModernStatsQuickView>
                <ModernQuickStat>
                  <div className="label">Products</div>
                  <div className="value">{processedProducts.length}</div>
                </ModernQuickStat>
                <ModernQuickStat>
                  <div className="label">Overpriced</div>
                  <div className="value">{processedProducts.filter(p => p.hasShopifyHigher).length}</div>
                </ModernQuickStat>
                <ModernQuickStat>
                  <div className="label">Best Deals</div>
                  <div className="value">{processedProducts.filter(p => p.hasAmazonHigher).length}</div>
                </ModernQuickStat>
              </ModernStatsQuickView>
            </ModernHeaderLeft>
            
            <ModernHeaderActions>
              <ModernActionButton 
                className="secondary" 
                onClick={fetchProducts}
                disabled={loading}
              >
                <FiRefreshCw className={loading ? 'spin' : ''} />
                {loading ? 'Loading...' : 'Refresh'}
              </ModernActionButton>
              <ModernActionButton className="primary" onClick={downloadCSV}>
                <FiDownload />
                Export CSV
              </ModernActionButton>
            </ModernHeaderActions>
          </ModernHeaderContent>

          {/* Modern Controls */}
          <ModernControlsSection>
            <div className="controls-header">
              <div className="controls-info">
                <div className="icon-wrapper">
                  <FiFilter size={14} />
                </div>
                <div className="controls-text">
                  <h3>Filters & Sorting</h3>
                  <p>Filter by price differences and sort by various criteria</p>
                </div>
              </div>
              
              <div className="controls-actions">
                <ModernSelectButton
                  value={filterOption}
                  onChange={(e) => setFilterOption(e.target.value)}
                >
                  <option value="all">All Products</option>
                  <option value="amazon-higher">Amazon Price &gt; Shopify</option>
                  <option value="shopify-higher">Shopify Price &gt; Amazon</option>
                </ModernSelectButton>
                
                <ModernSelectButton
                  value={sortOption}
                  onChange={(e) => setSortOption(e.target.value)}
                >
                  <option value="name">Name</option>
                  <option value="shopify-asc">Shopify Price (Low to High)</option>
                  <option value="shopify-desc">Shopify Price (High to Low)</option>
                  <option value="amazon-shopify-diff">Amazon - Shopify Difference</option>
                  <option value="shopify-amazon-diff">Shopify - Amazon Difference</option>
                  <option value="max-diff">Max Price Difference</option>
                </ModernSelectButton>
                
                <ModernActionButton 
                  className="secondary"
                  onClick={handleToggleAll}
                >
                  {products.every(product => expandedProducts[product.product_id]) ? (
                    <>
                      <ChevronsUp className="h-4 w-4" />
                      Collapse All
                    </>
                  ) : (
                    <>
                      <ChevronsDown className="h-4 w-4" />
                      Expand All
                    </>
                  )}
                </ModernActionButton>
              </div>
            </div>
          </ModernControlsSection>
        </ModernHeaderSection>
      
        {/* Modern Product List */}
        <ModernSectionCard>
          <ModernSectionHeader>
            <h2>Product Price Comparison</h2>
            <p>Compare prices across marketplaces and identify the best deals</p>
          </ModernSectionHeader>
          <ModernSectionContent>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {processedProducts.map(product => (
                <ProductCard key={product.product_id}>
            {/* Product header */}
            <div 
              className="flex justify-between items-center p-6 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors duration-200"
              onClick={() => toggleProductExpansion(product.product_id)}
            >
              <div className="flex items-center">
                <h2 className="text-xl font-semibold text-gray-800">{product.title}</h2>
                <span className="ml-3 px-2.5 py-0.5 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
                  {product.variants.length} variant{product.variants.length !== 1 ? 's' : ''}
                </span>
                {countHigherShopifyVariants(product.variants) > 0 && (
                  <span className="ml-2 px-2.5 py-0.5 bg-red-100 text-red-800 text-sm font-medium rounded-full">
                    {countHigherShopifyVariants(product.variants)} higher on Shopify
                  </span>
                )}
                {countSignificantPriceDifference(product.variants) > 0 && (
                  <span className="ml-2 px-2.5 py-0.5 bg-orange-100 text-orange-800 text-sm font-medium rounded-full">
                    {countSignificantPriceDifference(product.variants)} variants ₹1+ higher on Shopify
                  </span>
                )}
              </div>
              {expandedProducts[product.product_id] ? 
                <ChevronUp className="h-6 w-6 text-gray-500" /> : 
                <ChevronDown className="h-6 w-6 text-gray-500" />
              }
            </div>
            
            {/* Variants section */}
            {expandedProducts[product.product_id] && (
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {product.variants.map(variant => (
                    <div key={variant.variant_id} className="bg-gray-50 rounded-xl p-5 hover:bg-gray-100 transition-colors duration-200">
                      {/* Variant details */}
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-800 mb-1">{variant.variant_title}</h3>
                          <div className="flex items-center text-sm text-gray-500">
                            <Tag className="h-4 w-4 mr-1.5" />
                            <span>{variant.sku}</span>
                          </div>
                        </div>
                        
                        {/* Best price badge */}
                        {variant.prices && getLowestPrice(variant.prices) && (
                          <div className="bg-green-100 text-green-800 text-sm font-medium px-3 py-1.5 rounded-full flex items-center">
                            <FaRupeeSign className="h-4 w-4 mr-1.5" />
                            Best: {getLowestPrice(variant.prices).platform}
                          </div>
                        )}
                      </div>
                      
                      {/* Price comparison */}
                      {variant.prices && (
                        <div className="space-y-3">
                          <div className="text-sm uppercase font-semibold text-gray-500 flex items-center">
                            <ArrowUpDown className="h-4 w-4 mr-2" />
                            Price Comparison
                          </div>
                          
                          <div className="grid grid-cols-2 gap-3">
                            {Object.entries(variant.prices).map(([platform, price]) => {
                              const isShopifyHigher = platform === 'shopify' && 
                                variant.prices.shopify !== null && 
                                variant.prices.amazon !== null && 
                                variant.prices.shopify > variant.prices.amazon;
                              
                              return (
                                <div 
                                  key={platform} 
                                  className={`p-3 rounded-lg text-center transition-all duration-200 ${
                                    isShopifyHigher
                                      ? 'bg-red-50 border-2 border-red-200 transform scale-105' 
                                      : 'bg-white border border-gray-200'
                                  }`}
                                >
                                  <div className="text-sm font-medium mb-1 capitalize text-gray-700">{platform}</div>
                                  <div className={`text-lg font-bold ${isShopifyHigher ? 'text-red-600' : 'text-gray-800'}`}>
                                    {formatCurrency(price)}
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                          {/* Price Difference Indicator */}
                          {variant.prices.shopify !== null && variant.prices.amazon !== null && (
                            <div className="mt-4 pt-4 border-t border-gray-100">
                              <div className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                                <div className="flex items-center">
                                  <ArrowUpDown className="h-4 w-4 mr-2 text-gray-500" />
                                  <span className="text-sm font-medium text-gray-700">Price Difference</span>
                                </div>
                                <div className={`text-sm font-semibold ${
                                  variant.prices.shopify > variant.prices.amazon 
                                    ? 'text-red-600' 
                                    : variant.prices.shopify < variant.prices.amazon 
                                      ? 'text-green-600' 
                                      : 'text-gray-600'
                                }`}>
                                  {variant.prices.shopify > variant.prices.amazon ? (
                                    <span className="flex items-center">
                                      <span className="mr-1">↑</span>
                                      ₹{Math.abs(variant.prices.shopify - variant.prices.amazon).toFixed(2)} higher on Shopify
                                    </span>
                                  ) : variant.prices.shopify < variant.prices.amazon ? (
                                    <span className="flex items-center">
                                      <span className="mr-1">↓</span>
                                      ₹{Math.abs(variant.prices.shopify - variant.prices.amazon).toFixed(2)} lower on Shopify
                                    </span>
                                  ) : (
                                    <span className="flex items-center">
                                      <span className="mr-1">=</span>
                                      Same price
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
                </ProductCard>
              ))}
            </div>
          </ModernSectionContent>
        </ModernSectionCard>
      </ModernContent>
    </ModernContainer>
  );
};

export default MarketPlacePrices;