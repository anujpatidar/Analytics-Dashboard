import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Custom hook for fetching data with loading and error states
 * @param {Function} fetchFunction - The API function to call
 * @param {Array} dependencies - Dependencies array to control when to refetch
 * @param {Object} initialParams - Initial parameters for the fetch function
 * @param {*} initialData - Initial data state
 * @returns {Object} { data, loading, error, refetch }
 */
const useDataFetching = (
  fetchFunction,
  dependencies = [],
  initialParams = {},
  initialData = null
) => {
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [params, setParams] = useState(initialParams);
  
  // Store initialParams in a ref to avoid dependency issues
  const initialParamsRef = useRef(initialParams);
  
  // Update ref when initialParams changes
  useEffect(() => {
    initialParamsRef.current = initialParams;
  }, [initialParams]);
  
  const fetchData = useCallback(async () => {
    if (!fetchFunction) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const result = await fetchFunction(params);
      setData(result);
      return result;
    } catch (err) {
      setError(err.message || 'An error occurred while fetching data');
      return null;
    } finally {
      setLoading(false);
    }
  }, [fetchFunction, params]);
  
  // Function to trigger a refetch with optional new parameters
  const refetch = useCallback((newParams = {}) => {
    setParams(prevParams => ({ ...prevParams, ...newParams }));
  }, []);
  
  // Fetch data on mount and when dependencies or params change
  useEffect(() => {
    let isMounted = true;
    
    const doFetch = async () => {
      try {
        const result = await fetchData();
        if (isMounted) {
          setData(result);
          setError(null);
        }
      } catch (err) {
        if (isMounted) {
          setError(err);
          setData(null);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    
    // Always fetch on mount and when dependencies or params change
    doFetch();
    
    return () => {
      isMounted = false;
    };
  }, [fetchData, ...dependencies]);
  
  return { data, loading, error, refetch };
};

export default useDataFetching; 