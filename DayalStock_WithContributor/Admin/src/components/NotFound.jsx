
const NotFound = () => {
  const handleGoHome = () => {
    // এখানে আপনার হোম পেজের রাউটিং লজিক দিতে পারেন
    window.location.href = '/';
  };

  const handleContactSupport = () => {
    // এখানে সাপোর্ট পেজের লিঙ্ক বা লজিক দিতে পারেন
    window.location.href = '/support';
  };

  return (
    <div className="bg-[#f9f9f9] font-inter min-h-screen flex items-center justify-center antialiased">
      {/* Error 404 Section */}
      <section className="py-20 px-4 md:px-12 lg:px-24 w-full">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-none shadow-sm p-12 md:p-16 text-center">
            
            {/* Error Number */}
            <div className="mb-8">
              <h1 className="text-8xl md:text-9xl font-bold text-black mb-4 select-none">
                404
              </h1>
              <div className="w-24 h-1 bg-black mx-auto mb-6"></div>
            </div>

            {/* Error Message */}
            <div className="mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-black mb-6">
                Page Not Found
              </h2>
              <p className="text-lg text-gray-600 leading-relaxed max-w-2xl mx-auto mb-8">
                The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <button 
                onClick={handleGoHome}
                className="px-8 py-4 bg-black text-white text-lg font-medium hover:bg-gray-800 transition-colors whitespace-nowrap w-full sm:w-auto cursor-pointer"
              >
                Go Back Home
              </button>
              
              <button 
                onClick={handleContactSupport}
                className="px-8 py-4 bg-white text-black border border-gray-300 text-lg font-medium hover:bg-gray-50 transition-colors whitespace-nowrap w-full sm:w-auto cursor-pointer"
              >
                Contact Support
              </button>
            </div>

            {/* Additional Help */}
            <div className="mt-12 pt-8 border-t border-gray-200">
              <p className="text-gray-500 text-sm mb-4">Need immediate assistance?</p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center text-sm">
                <a href="#help" className="text-black hover:text-gray-700 transition-colors">
                  Help Center
                </a>
                <span className="text-gray-300 hidden sm:inline">•</span>
                <a href="#docs" className="text-black hover:text-gray-700 transition-colors">
                  Documentation
                </a>
                <span className="text-gray-300 hidden sm:inline">•</span>
                <a href="#forum" className="text-black hover:text-gray-700 transition-colors">
                  Community Forum
                </a>
              </div>
            </div>

          </div>
        </div>
      </section>
    </div>
  );
};

export default NotFound;