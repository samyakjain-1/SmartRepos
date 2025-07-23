import { Link } from 'react-router-dom';
import { useSession } from 'modelence/client';



export default function Header() {
  const { user } = useSession();

  return (
    <div className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Brand */}
          <Link to="/" className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
    
            <span className="text-xl font-bold text-gray-900 hidden sm:block">
              GitHub Trends
            </span>
          </Link>

          {/* Navigation */}
          <div className="flex items-center space-x-6">
            <Link 
              to="/" 
              className="text-gray-700 hover:text-gray-900 font-medium transition-colors"
            >
              Trending
            </Link>

            <Link 
              to="/search" 
              className="text-gray-700 hover:text-gray-900 font-medium transition-colors"
            >
              Search Repo
            </Link>

            {user ? (
              /* Authenticated User Navigation - Clean Button Layout */
              <Link 
                to="/saved-repos" 
                className="flex items-center space-x-2 text-gray-700 hover:text-blue-600 font-medium transition-colors"
              >
                <span>Saved Repos</span>
              </Link>
            ) : (
              /* Login/Signup Buttons for Unauthenticated Users */
              <div className="flex items-center space-x-3">
                <Link 
                  to="/auth/login"
                  className="text-gray-700 hover:text-gray-900 font-medium transition-colors"
                >
                  Login
                </Link>
                <Link 
                  to="/auth/signup"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-lg transition-colors"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 