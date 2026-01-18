import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import Layout from '../components/Layout';
import GamesServices from '../../v2-services/games-service';
import { useTranslation } from 'react-i18next';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5002';

const LoginSuccess: React.FC = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setUser } = useUser();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = searchParams.get('token');

    if (!token) {
      setError(t('auth.noTokenReceived'));
      setLoading(false);
      return;
    }

    // Verify token with backend and get user info
    const verifyAndSetUser = async () => {
      try {
        const response = await fetch(`${BACKEND_URL}/v1/auth/verify`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          credentials: 'include'
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error?.message || t('auth.tokenVerificationFailed'));
        }

        const data = await response.json();
        
        if (data.status && data.data) {
          const userData = data.data;
          const userId = userData.userId || userData._id;
          const username = userData.name || userData.email?.split('@')[0] || 'User';
          
          // Store user with token
          setUser({
            username: username,
            user_id: userId,
            email: userData.email,
            token: token
          });

          // Fetch continueGames from backend and store in localStorage
          if (userId) {
            try {
              const continueGamesResponse = await GamesServices.getContinueGames(userId);
              console.log(" continueGamesResponse from login success page ", continueGamesResponse);
              if (continueGamesResponse?.data?.status && continueGamesResponse?.data?.data?.continuous_games) {
                const continueGames = continueGamesResponse.data.data.continuous_games || [];
                if (Array.isArray(continueGames) && continueGames.length > 0) {
                  localStorage.setItem(`continueGames_${username}`, JSON.stringify(continueGames));
                }
              }
            } catch (continueGamesError) {
              console.error('Error fetching continueGames after login:', continueGamesError);
              // Continue with login even if continueGames fetch fails
            }
          }

          // Redirect to home page after a short delay
          setTimeout(() => {
            navigate('/');
          }, 1000);
        } else {
          throw new Error(t('auth.invalidResponseFromServer'));
        }
      } catch (err) {
        console.error('Error verifying token:', err);
        setError(err instanceof Error ? err.message : t('auth.failedToVerifyAuthenticationToken'));
        setLoading(false);
      }
    };

    verifyAndSetUser();
  }, [searchParams, setUser, navigate]);

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-16 text-center">
          <div className="max-w-md mx-auto">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600 mx-auto mb-4"></div>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              {t('auth.verifyingAuthentication')}
            </p>
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-16 text-center">
          <div className="max-w-md mx-auto">
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              <p className="font-semibold">{t('auth.authenticationError')}</p>
              <p>{error}</p>
            </div>
            <button
              onClick={() => navigate('/')}
              className="bg-violet-600 text-white px-6 py-2 rounded hover:bg-violet-700"
            >
              {t('common.goToHome')}
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-16 text-center">
        <div className="max-w-md mx-auto">
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
            <p className="font-semibold">{t('auth.loginSuccessful')}</p>
            <p>{t('auth.redirectingToHomePage')}</p>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default LoginSuccess;

