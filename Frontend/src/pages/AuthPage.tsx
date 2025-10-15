import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Login from './Login';
import Register from './Register';
import { useAuth } from '../context/AuthContext';

const AuthPage: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [gradientPosition, setGradientPosition] = useState(0);
  const { currentUser, forceLogout } = useAuth();

  // Create a subtle moving gradient effect
  useEffect(() => {
    const interval = setInterval(() => {
      setGradientPosition((prev) => (prev + 1) % 100);
    }, 50);
    return () => clearInterval(interval);
  }, []);

  const toggleForm = () => {
    setIsLogin(!isLogin);
  };

  return (
    <motion.div 
      className="flex items-center justify-center min-h-screen"
      style={{
        backgroundImage: `linear-gradient(135deg, #4f46e5 ${gradientPosition}%, #3b82f6 ${(gradientPosition + 50) % 100}%, #0ea5e9 ${(gradientPosition + 75) % 100}%)`,
        backgroundSize: '400% 400%'
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
    >
      <motion.div 
        className="w-full max-w-md p-8 space-y-6 bg-white rounded-2xl shadow-2xl"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}>
        
        <motion.div 
          className="text-center mb-6"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <div className="flex justify-center mb-4">
            <div className="bg-blue-600 p-3 rounded-full">
              <svg className="h-8 w-8 text-white" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z" />
              </svg>
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-800">University Management Interface</h1>
          <p className="text-gray-600 mt-1">Access your university portal</p>
        </motion.div>
        
        <motion.div 
          className="flex justify-center mb-6"
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <div className="relative w-full max-w-xs">
            <div className="flex rounded-lg bg-gray-200 p-1">
              <motion.button
                onClick={() => setIsLogin(true)}
                className={`w-1/2 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${isLogin ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-300'}`}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                Login
              </motion.button>
              <motion.button
                onClick={() => setIsLogin(false)}
                className={`w-1/2 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${!isLogin ? 'bg-green-600 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-300'}`}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                Register
              </motion.button>
            </div>
          </div>
        </motion.div>

        <motion.div 
          className="relative overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.8 }}
        >
          {isLogin ? (
            <motion.div
              className="w-full"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4 }}
            >
              <Login />
            </motion.div>
          ) : (
            <motion.div
              className="w-full"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4 }}
            >
              <Register />
            </motion.div>
          )}
        </motion.div>

        <motion.div
          className="text-center mt-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 1 }}
        >
          <p className="text-sm text-gray-600">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <motion.button
              onClick={toggleForm}
              className={`font-medium ${isLogin ? 'text-green-600 hover:text-green-800' : 'text-blue-600 hover:text-blue-800'}`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {isLogin ? "Register" : "Login"}
            </motion.button>
          </p>

          {/* Debug logout button - only show if user is authenticated */}
          {currentUser && (
            <motion.div
              className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <p className="text-xs text-yellow-800 mb-2">
                🔧 Debug: You're currently logged in as <strong>{currentUser.username}</strong> ({currentUser.role})
              </p>
              <motion.button
                onClick={forceLogout}
                className="px-3 py-1 bg-yellow-600 text-white text-xs rounded hover:bg-yellow-700 transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Force Logout & Clear Session
              </motion.button>
            </motion.div>
          )}
        </motion.div>
        
        <motion.div 
          className="border-t border-gray-200 pt-4 mt-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 1.2 }}
        >
          <p className="text-xs text-center text-gray-500">
            © {new Date().getFullYear()} University Management System. All rights reserved.
          </p>
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

export default AuthPage;