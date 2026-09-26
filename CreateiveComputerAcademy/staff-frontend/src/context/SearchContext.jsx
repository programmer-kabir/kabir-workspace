import React, { createContext, useContext, useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const SearchContext = createContext();

export const SearchProvider = ({ children }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const location = useLocation();

  // Reset search input when navigating to another page
  useEffect(() => {
    setSearchTerm('');
  }, [location.pathname]);

  return (
    <SearchContext.Provider value={{ searchTerm, setSearchTerm, pathname: location.pathname }}>
      {children}
    </SearchContext.Provider>
  );
};

export const useSearch = () => {
  const context = useContext(SearchContext);
  if (!context) {
    return { searchTerm: '', setSearchTerm: () => {}, pathname: '' };
  }
  return context;
};

export default SearchContext;
