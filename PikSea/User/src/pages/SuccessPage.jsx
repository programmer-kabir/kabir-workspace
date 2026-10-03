import { useLocation, useNavigate, Navigate } from 'react-router-dom';
import { CheckCircle, ArrowRight } from 'lucide-react';
import useAuth from '../utlis/Hooks/useAuth';
import DayalLoader from '../components/Common/DayalLoader';

const SuccessPage = () => {
  const { user, loading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  
  const plan = location.state?.plan;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#050505] transition-colors">
        <DayalLoader text="Finalizing your subscription..." />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#050505] flex items-center justify-center p-4 transition-colors duration-300">
      <div className="max-w-md w-full bg-white dark:bg-[#111] rounded-3xl shadow-2xl p-8 text-center border border-gray-100 dark:border-white/10">
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="absolute inset-0 bg-green-100 dark:bg-green-900/30 rounded-full animate-ping opacity-75"></div>
            <CheckCircle className="relative text-green-500 w-20 h-20 bg-white dark:bg-[#111] rounded-full" />
          </div>
        </div>

        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-2 font-outfit">Payment Successful!</h1>
        <p className="text-gray-600 dark:text-gray-300 mb-8 text-sm">
          {plan?.name ? (
            <>Thank you for subscribing to the <strong className="text-gray-900 dark:text-white">{plan.name}</strong> plan.</>
          ) : (
            <>Thank you for your purchase. Your subscription / credits have been credited to your account.</>
          )}
          <br className="mb-2" />
          Your account has been upgraded and you now have premium access.
        </p>

        <div className="space-y-4">
          <button
            onClick={() => navigate('/')}
            className="w-full flex items-center justify-center gap-2 bg-gray-900 text-white font-bold py-4 px-6 rounded-xl hover:bg-black transition-colors"
          >
            Start Browsing Premium Content <ArrowRight size={18} />
          </button>
          
          <button
            onClick={() => navigate('/profile')}
            className="w-full flex items-center justify-center bg-gray-100 text-gray-700 font-bold py-4 px-6 rounded-xl hover:bg-gray-200 transition-colors"
          >
            View My Profile
          </button>
        </div>
      </div>
    </div>
  );
};

export default SuccessPage;
