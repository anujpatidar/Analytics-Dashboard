import React from 'react';
import { 
  FiBell, 
  FiMail, 
  FiSearch, 
  FiCalendar, 
  FiChevronDown 
} from 'react-icons/fi';

const Navbar = () => {
  // Get current date
  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  });
  
  return (
    <header className="h-[70px] bg-gradient-to-r from-white via-gray-50 to-white border-b border-gray-200 shadow-sm flex items-center justify-between px-4 lg:px-6 relative z-5">
      {/* Search Bar */}
      <div className="relative flex-1 max-w-sm lg:max-w-md xl:max-w-lg">
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
          <FiSearch className="w-4 h-4 text-gray-400" />
        </div>
        <input 
          type="text" 
          placeholder="Search..." 
          className="w-full h-9 pl-10 pr-3 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 text-sm placeholder-gray-400 shadow-sm hover:shadow-md"
        />
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