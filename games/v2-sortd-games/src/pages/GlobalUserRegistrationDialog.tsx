import React from 'react';
import { useUserRegistration } from '../context/UserRegistrationContext';
import UserRegistrationDialog from '../components/UserRegistrationDialog';

const GlobalUserRegistrationDialog: React.FC = () => {
  const { showRegistrationDialog, closeRegistrationDialog, onRegistrationSuccess } = useUserRegistration();

  const handleSuccess = (user: { username: string }) => {
    if (onRegistrationSuccess) {
      onRegistrationSuccess(user);
    }
    closeRegistrationDialog();
  };

  return (
    <UserRegistrationDialog
      isOpen={showRegistrationDialog}
      onClose={closeRegistrationDialog}
      onSuccess={handleSuccess}
    />
  );
};

export default GlobalUserRegistrationDialog;