import React, { useState, useEffect } from 'react';
import CryptoJS from 'crypto-js';

const PasswordProtection = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const generateAuthToken = (password) => {
    const timestamp = Date.now();
    const hash = CryptoJS.SHA256(password + timestamp).toString();
    return { hash, timestamp };
  };

  const verifyAuthToken = (storedToken) => {
    try {
      const { hash, timestamp } = JSON.parse(storedToken);
      const currentTime = Date.now();
      // Token expires after 24 hours
      if (currentTime - timestamp > 24 * 60 * 60 * 1000) {
        return false;
      }
      return true;
    } catch {
      return false;
    }
  };

  useEffect(() => {
    // Check if already authenticated with valid token
    const storedToken = localStorage.getItem('authToken');
    if (storedToken && verifyAuthToken(storedToken)) {
      setIsAuthenticated(true);
    } else {
      // Clear invalid token
      localStorage.removeItem('authToken');
    }
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    // Hash the entered password
    const hashedInput = CryptoJS.SHA256(password).toString();
    // Compare with the hashed password from env
    const correctHashedPassword = process.env.REACT_APP_SITE_PASSWORD_HASH;
    
    if (hashedInput === correctHashedPassword) {
      const authToken = generateAuthToken(password);
      localStorage.setItem('authToken', JSON.stringify(authToken));
      setIsAuthenticated(true);
      setError('');
    } else {
      setError('Incorrect password');
    }
  };

  if (isAuthenticated) {
    return children;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-160 transform transition-all hover:scale-105">
        <div className="flex flex-col items-center mb-8">
          <img 
            src="https://cdn.shopify.com/s/files/1/0553/0419/2034/files/Layer_1_1.png?v=1739439173&width=432" 
            alt="Frido Logo" 
            className="w-32 h-auto mb-6"
          />
          <h2 className="text-3xl font-bold text-gray-800 mb-2">Welcome Back</h2>
          <p className="text-gray-600 text-center">Please enter the password to access the analytics dashboard</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="relative">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
              placeholder="Enter password"
              required
            />
            {error && (
              <p className="absolute -bottom-6 left-0 text-red-500 text-sm">{error}</p>
            )}
          </div>
          
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transform transition-all hover:scale-105 active:scale-95"
          >
            Access Dashboard
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            This is a secure area. Please contact your administrator if you need access.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PasswordProtection; 