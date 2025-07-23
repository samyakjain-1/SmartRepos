import { LoginForm } from '@modelence/auth-ui';
import { useSession } from 'modelence/client';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Page from '../components/Page';
import PageTransition from '../components/PageTransition';

export default function LoginPage() {
  const { user } = useSession();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/', { replace: true });
    }
  }, [user, navigate]);

  return (
    <Page title="Login">
      <PageTransition>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-md w-full space-y-8">
            <div className="text-center">
              <h2 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
                Welcome Back!
              </h2>
              <p className="text-gray-600 text-lg">
                Sign in to access your personalized GitHub trends
              </p>
            </div>
            <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-200">
              <LoginForm />
            </div>
      </div>
    </div>
      </PageTransition>
    </Page>
  );
} 