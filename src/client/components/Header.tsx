import { Link } from 'react-router-dom';
import { useSession } from 'modelence/client';
import { useState } from 'react';



export default function Header() {
  const { user } = useSession();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="bg-white border-b border-gray-200 shadow-sm relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Brand */}
          <Link to="/" className="flex items-center space-x-3 hover:opacity-80 transition-opacity" onClick={closeMobileMenu}>
            <span className="text-xl font-bold text-gray-900">
              SmartRepos
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
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

          {/* Mobile Hamburger Menu Button */}
          <div className="md:hidden">
            <button
              onClick={toggleMobileMenu}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 transition-colors"
              aria-expanded="false"
            >
              <span className="sr-only">Open main menu</span>
              {!isMobileMenuOpen ? (
                /* Hamburger icon */
                <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              ) : (
                /* Close icon */
                <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {isMobileMenuOpen && (
        <div className="md:hidden absolute top-16 right-4 z-50">
          <div className="bg-white rounded-lg shadow-xl border border-gray-200 py-2 w-48 overflow-hidden">
            <Link
              to="/"
              className="text-gray-700 hover:text-gray-900 hover:bg-gray-50 block px-4 py-3 text-sm font-medium transition-colors border-b border-gray-100 last:border-b-0"
              onClick={closeMobileMenu}
            >
              Trending
            </Link>

            <Link
              to="/search"
              className="text-gray-700 hover:text-gray-900 hover:bg-gray-50 block px-4 py-3 text-sm font-medium transition-colors border-b border-gray-100 last:border-b-0"
              onClick={closeMobileMenu}
            >
              Search Repo
            </Link>

            {user ? (
              <Link
                to="/saved-repos"
                className="text-gray-700 hover:text-blue-600 hover:bg-gray-50 block px-4 py-3 text-sm font-medium transition-colors"
                onClick={closeMobileMenu}
              >
                Saved Repos
              </Link>
            ) : (
              <>
                <Link
                  to="/auth/login"
                  className="text-gray-700 hover:text-gray-900 hover:bg-gray-50 block px-4 py-3 text-sm font-medium transition-colors border-b border-gray-100"
                  onClick={closeMobileMenu}
                >
                  Login
                </Link>
                <Link
                  to="/auth/signup"
                  className="bg-blue-600 hover:bg-blue-700 text-white block px-4 py-3 text-sm font-medium transition-colors rounded-b-lg"
                  onClick={closeMobileMenu}
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
