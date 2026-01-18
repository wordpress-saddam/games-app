import React from 'react';
import { Button } from './ui/button';
import { useTranslation } from 'react-i18next';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5002';
console.log("VITE_BACKEND_URL",import.meta.env.VITE_BACKEND_URL);
interface KeycloakLoginButtonProps {
  className?: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg';
}

const KeycloakLoginButton: React.FC<KeycloakLoginButtonProps> = ({ 
  className = '', 
  variant = 'default',
  size = 'default'
}) => {
  const { t } = useTranslation();
  
  //const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5002';
  const handleKeycloakLogin = () => {
    // Redirect to backend Keycloak OAuth endpoint
    window.location.href = `${BACKEND_URL}/v1/auth/keycloak`;
  };

  return (
    <Button
      onClick={handleKeycloakLogin}
      className={className}
      variant={variant}
      size={size}
    >
      {t('auth.signInWithKeycloak')}
    </Button>
  );
};

export default KeycloakLoginButton;

