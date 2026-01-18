import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Layout from '../components/Layout';
import { useTranslation } from 'react-i18next';

const LoginError: React.FC = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const errorMessage = searchParams.get('message') || t('auth.anErrorOccurredDuringAuthentication');

  return (
    <Layout>
      <div className="container mx-auto px-4 py-16 text-center">
        <div className="max-w-md mx-auto">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <p className="font-semibold">{t('auth.authenticationFailed')}</p>
            <p>{errorMessage}</p>
          </div>
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => navigate('/')}
              className="bg-violet-600 text-white px-6 py-2 rounded hover:bg-violet-700"
            >
              {t('common.goToHome')}
            </button>
            <button
              onClick={() => {
                const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5002';
                window.location.href = `${backendUrl}/v1/auth/keycloak`;
              }}
              className="bg-gray-600 text-white px-6 py-2 rounded hover:bg-gray-700"
            >
              {t('common.tryAgain')}
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default LoginError;

