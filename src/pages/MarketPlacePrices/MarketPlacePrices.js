import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, ArrowUpDown, DollarSign, Tag, Filter, SortAsc, AlertCircle } from 'lucide-react';
import axios from 'axios';

const MarketPlacePrices = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedProducts, setExpandedProducts] = useState({});
  
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
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Product Catalog</h1>
        <p className="text-gray-600">Compare prices across different marketplaces</p>
      </div>
      
      {/* Filter and sort controls */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center space-x-3">
            <Filter className="h-5 w-5 text-gray-500" />
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-700">Filter:</span>
              <select className="border border-gray-200 rounded-lg p-2 text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                <option>All Products</option>
                <option>Knee Support</option>
                <option>Socks</option>
              </select>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <SortAsc className="h-5 w-5 text-gray-500" />
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-700">Sort by:</span>
              <select className="border border-gray-200 rounded-lg p-2 text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                <option>Name</option>
                <option>Lowest Price</option>
                <option>Highest Price</option>
              </select>
            </div>
          </div>
        </div>
      </div>
      
      {/* Product list */}
      <div className="space-y-4">
        {products.map(product => (
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