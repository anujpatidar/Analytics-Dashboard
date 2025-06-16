import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FiBell, 
  FiMail, 
  FiSearch, 
  FiCalendar, 
  FiChevronDown,
  FiX
} from 'react-icons/fi';

const Navbar = () => {
  const navigate = useNavigate();
  const searchRef = useRef(null);
  
  // Search functionality state
  const [searchTerm, setSearchTerm] = useState('');
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearchLoading, setIsSearchLoading] = useState(false);
  const [allProducts, setAllProducts] = useState([]);

  // Get current date
  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  });

  // Fetch all products for search functionality
  const fetchAllProducts = async () => {
    try {
      console.log('Fetching products for search...'); // Debug log
      const response = await fetch('http://localhost:8080/api/v1/products/get-all-products');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const result = await response.json();
      console.log('Products fetched successfully:', result.data?.length || 0); // Debug log
      setAllProducts(result.data || []);
    } catch (error) {
      console.error('Error fetching products for search:', error);
    }
  };

  // Handle search input change
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    
    console.log('Search term:', value); // Debug log
    console.log('All products available:', allProducts.length); // Debug log
    
    if (value.trim().length > 0) {
      setIsSearchLoading(true);
      
      // Filter products based on search term with proper null checks
      const filtered = allProducts
        .filter(product => {
          // Safely check product title (API returns 'title', not 'name')
          const productTitle = product?.title || '';
          const productHandle = product?.handle || '';
          
          // Check if any variant has a matching SKU
          const hasMatchingSku = product?.variants?.some(variant => {
            const variantSku = variant?.sku || '';
            return variantSku.toLowerCase().includes(value.toLowerCase());
          }) || false;
          
          const titleMatch = productTitle.toLowerCase().includes(value.toLowerCase());
          const handleMatch = productHandle.toLowerCase().includes(value.toLowerCase());
          
          return titleMatch || handleMatch || hasMatchingSku;
        })
        .slice(0, 6); // Limit to 6 suggestions for navbar
      
      console.log('Filtered products:', filtered.length); // Debug log
      
      setSearchSuggestions(filtered);
      setShowSuggestions(true);
      setIsSearchLoading(false);
    } else {
      setSearchSuggestions([]);
      setShowSuggestions(false);
      setIsSearchLoading(false);
    }
  };

  // Handle suggestion click
  const handleSuggestionClick = (product) => {
    // Check if product has a valid title before navigating
    if (product?.title) {
      // Convert product title to slug format (lowercase with hyphens)
      const slug = product.title.toLowerCase().replace(/ /g, '-');
      // Navigate to the product details page using slug format
      navigate(`/products/${slug}`);
      setSearchTerm('');
      setShowSuggestions(false);
    } else {
      console.warn('Product title is missing, cannot navigate:', product);
    }
  };

  // Clear search
  const handleClearSearch = () => {
    setSearchTerm('');
    setShowSuggestions(false);
    setSearchSuggestions([]);
  };

  // Handle search form submission
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchTerm.trim() && searchSuggestions.length > 0) {
      // Navigate to the first suggestion
      handleSuggestionClick(searchSuggestions[0]);
    }
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Fetch products on component mount
  useEffect(() => {
    fetchAllProducts();
  }, []);
  
  return (
    <header className="h-[70px] bg-gradient-to-r from-white via-gray-50 to-white border-b border-gray-200 shadow-sm flex items-center justify-between px-4 lg:px-6 relative z-50">
      {/* Enhanced Search Bar */}
      <div className="relative flex-1 max-w-sm lg:max-w-md xl:max-w-lg" ref={searchRef}>
        <form onSubmit={handleSearchSubmit}>
          <div className="relative">
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
              <FiSearch className="w-4 h-4 text-gray-400" />
            </div>
            <input 
              type="text" 
              placeholder="Search products..." 
              value={searchTerm}
              onChange={handleSearchChange}
              onFocus={() => {
                if (searchTerm.trim().length > 0 && searchSuggestions.length > 0) {
                  setShowSuggestions(true);
                }
              }}
              className="w-full h-9 pl-10 pr-10 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 text-sm placeholder-gray-400 shadow-sm hover:shadow-md"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <FiX className="w-4 h-4" />
              </button>
            )}
          </div>
        </form>
        
        {/* Search Suggestions Dropdown */}
        {showSuggestions && (
          <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg mt-1 max-h-80 overflow-y-auto z-50">
            {isSearchLoading ? (
              <div className="p-3 text-center text-gray-500 text-sm">
                Searching...
              </div>
            ) : searchSuggestions.length > 0 ? (
              <div>
                {searchSuggestions.map((product) => (
                  <div
                    key={product.id}
                    onClick={() => handleSuggestionClick(product)}
                    className="flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors"
                  >
                    <img
                      src={product?.image || 'https://via.placeholder.com/40'}
                      alt={product?.title || 'Product'}
                      className="w-10 h-10 rounded-lg object-cover border border-gray-200 flex-shrink-0"
                      onError={(e) => {
                        e.target.src = 'https://via.placeholder.com/40';
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 text-sm truncate">
                        {product?.title || 'Unnamed Product'}
                      </div>
                      <div className="text-gray-500 text-xs">
                        SKU: {product?.variants?.[0]?.sku || 'N/A'}
                      </div>
                    </div>
                  </div>
                ))}
                {searchSuggestions.length >= 6 && (
                  <div className="p-2 text-center text-gray-500 text-xs border-t border-gray-100">
                    Showing top 6 results
                  </div>
                )}
              </div>
            ) : searchTerm.trim().length > 0 ? (
              <div className="p-3 text-center text-gray-500 text-sm">
                No products found matching "{searchTerm}"
              </div>
            ) : null}
          </div>
        )}
      </div>
      
      {/* Right Actions */}
      <div className="flex items-center space-x-2 lg:space-x-4 ml-4">
        
        {/* Date Display */}
        <div className="hidden md:flex items-center space-x-2 px-3 py-1.5 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg border border-gray-200 shadow-sm">
          <div className="p-1 bg-white rounded-md shadow-sm">
            <FiCalendar className="w-3 h-3 text-blue-600" />
          </div>
          <span className="text-xs font-medium text-gray-700 whitespace-nowrap">{currentDate}</span>
        </div>
        
        {/* Action Buttons */}
        <div className="flex items-center space-x-1">
          <button className="relative w-8 h-8 rounded-lg bg-white border border-gray-200 shadow-sm hover:shadow-md hover:bg-gray-50 transition-all duration-200 flex items-center justify-center group">
            <FiMail className="w-4 h-4 text-gray-600 group-hover:text-blue-600" />
          </button>
          
          <button className="relative w-8 h-8 rounded-lg bg-white border border-gray-200 shadow-sm hover:shadow-md hover:bg-gray-50 transition-all duration-200 flex items-center justify-center group">
            <FiBell className="w-4 h-4 text-gray-600 group-hover:text-blue-600" />
            <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-red-500 rounded-full border border-white animate-pulse"></div>
          </button>
        </div>
        
        {/* User Profile */}
        <div className="flex items-center space-x-2 cursor-pointer group bg-white rounded-lg px-2 py-1.5 border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200">
          <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center text-white font-semibold text-xs shadow-lg">
            AP
          </div>
          <div className="hidden">
            <h4 className="text-xs font-semibold text-gray-900 leading-tight">Anuj</h4>
            <p className="text-xs text-gray-500 leading-tight">Owner</p>
          </div>
          <FiChevronDown className="w-3 h-3 text-gray-400 group-hover:text-gray-600 transition-colors duration-200" />
        </div>
      </div>
    </header>
  );
};

export default Navbar; 