import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, Home, ArrowLeft } from 'lucide-react';

const NotFound = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}&type=all`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#050505] flex items-center justify-center p-4 relative overflow-hidden font-inter transition-colors duration-300">
      {/* Background Decorative Elements */}
      <motion.div 
        animate={{ 
          scale: [1, 1.2, 1],
          rotate: [0, 90, 0],
        }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-purple-300 dark:bg-purple-900 rounded-full mix-blend-multiply filter blur-[100px] opacity-40"
      />
      <motion.div 
        animate={{ 
          scale: [1, 1.3, 1],
          rotate: [0, -90, 0],
        }}
        transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
        className="absolute top-[20%] right-[-10%] w-96 h-96 bg-pink-300 dark:bg-pink-900 rounded-full mix-blend-multiply filter blur-[100px] opacity-40"
      />
      <motion.div 
        animate={{ 
          scale: [1, 1.1, 1],
          rotate: [0, 180, 0],
        }}
        transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
        className="absolute bottom-[-20%] left-[20%] w-96 h-96 bg-blue-300 dark:bg-blue-900 rounded-full mix-blend-multiply filter blur-[100px] opacity-40"
      />

      <div className="max-w-3xl w-full text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, type: "spring", bounce: 0.5 }}
          >
            <h1 className="text-[120px] md:text-[180px] font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-[#6C4FE0] to-[#FF6B6B] leading-none select-none tracking-tighter drop-shadow-sm">
              404
            </h1>
          </motion.div>
          
          <h2 className="text-3xl md:text-5xl font-bold text-gray-900 dark:text-white mt-2 mb-6">
            Page Not Found
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-10 max-w-xl mx-auto leading-relaxed">
            Oops! The creative asset or page you are looking for seems to have vanished. It might have been moved or deleted.
          </p>

          <form onSubmit={handleSearch} className="relative max-w-lg mx-auto mb-12 shadow-[0_8px_30px_rgb(0,0,0,0.2)] rounded-full group">
            <div className="absolute inset-0 bg-gradient-to-r from-[#6C4FE0] to-[#FF6B6B] rounded-full blur opacity-25 group-hover:opacity-40 transition-opacity duration-300"></div>
            <div className="relative flex items-center bg-white dark:bg-gray-800 rounded-full border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
              <input
                type="text"
                placeholder="Search for vectors, photos, videos..."
                className="w-full pl-6 pr-4 py-4 bg-transparent text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none text-base sm:text-lg"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button
                type="submit"
                className="mr-2 bg-[#6C4FE0] text-white p-3 rounded-full hover:bg-[#583cc2] transition-colors flex items-center justify-center shrink-0"
              >
                <Search size={20} />
              </button>
            </div>
          </form>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 px-8 py-3.5 rounded-full bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-300 dark:hover:border-gray-600 font-medium transition-all w-full sm:w-auto justify-center group shadow-sm"
            >
              <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
              Go Back
            </button>
            <Link
              to="/"
              className="flex items-center gap-2 px-8 py-3.5 rounded-full bg-[#6C4FE0] text-white hover:bg-[#583cc2] hover:shadow-lg hover:shadow-[#6C4FE0]/30 font-medium transition-all w-full sm:w-auto justify-center"
            >
              <Home size={18} />
              Back to Home
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default NotFound;