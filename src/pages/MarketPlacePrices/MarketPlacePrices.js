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
import { ChevronDown, ChevronUp, ArrowUpDown, DollarSign, Tag, Filter, SortAsc, AlertCircle } from 'lucide-react';
import axios from 'axios';

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
      const response = await axios.get('http://localhost:8080/api/v1/get-marketplace-prices');
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
    
    let lowestPlatform = platforms[0];
    
    platforms.forEach(platform => {
      if (prices[platform] < prices[lowestPlatform]) {
        lowestPlatform = platform;
      }
    });
    
    return { platform: lowestPlatform, price: prices[lowestPlatform] };
  };

  // Function to format price display
  const formatPrice = (price) => {
    if (price === null) return 'N/A';
    return `₹${price}`;
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
    <div className="max-w-7xl mx-auto p-6 bg-gray-50 min-h-screen">

      
      {/* Filter and sort controls */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
        <div className="flex sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center space-x-3">
            <Filter className="h-5 w-5 text-gray-500" />
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-700">Filter:</span>
              <select 
                className="border border-gray-200 rounded-lg p-2 text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={filterOption}
                onChange={(e) => setFilterOption(e.target.value)}
              >
                <option value="all">All Products</option>
                <option value="amazon-higher">Amazon Price &gt; Shopify</option>
                <option value="shopify-higher">Shopify Price &gt; Amazon</option>
              </select>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <SortAsc className="h-5 w-5 text-gray-500" />
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-700">Sort by:</span>
              <select 
                className="border border-gray-200 rounded-lg p-2 text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value)}
              >
                <option value="name">Name</option>
                <option value="shopify-asc">Shopify Price (Low to High)</option>
                <option value="shopify-desc">Shopify Price (High to Low)</option>
                <option value="amazon-shopify-diff">Amazon - Shopify Difference</option>
                <option value="shopify-amazon-diff">Shopify - Amazon Difference</option>
                <option value="max-diff">Max Price Difference</option>
              </select>
            </div>
          </div>
        </div>
      </div>
      
      {/* Product list */}
      <div className="space-y-4">
        {processedProducts.map(product => (
          <div 
            key={product.product_id} 
            className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200"
          >
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
                            <DollarSign className="h-4 w-4 mr-1.5" />
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
                              const isLowest = getLowestPrice(variant.prices)?.platform === platform;
                              return (
                                <div 
                                  key={platform} 
                                  className={`p-3 rounded-lg text-center transition-all duration-200 ${
                                    isLowest 
                                      ? 'bg-green-50 border-2 border-green-200 transform scale-105' 
                                      : 'bg-white border border-gray-200'
                                  }`}
                                >
                                  <div className="text-sm font-medium mb-1 capitalize text-gray-700">{platform}</div>
                                  <div className={`text-lg font-bold ${isLowest ? 'text-green-600' : 'text-gray-800'}`}>
                                    {formatPrice(price)}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default MarketPlacePrices;