import React, { createContext, useContext, useState, useEffect } from 'react';

const SearchContext = createContext();

export const SearchProvider = ({ children, activeTab = '/' }) => {
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    setSearchTerm('');
  }, [activeTab]);

  return (
    <SearchContext.Provider value={{ searchTerm, setSearchTerm, pathname: activeTab }}>
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
