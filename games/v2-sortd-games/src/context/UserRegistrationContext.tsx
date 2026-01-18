import React, { createContext, useContext, useState, ReactNode } from 'react';

interface UserRegistrationContextType {
  showRegistrationDialog: boolean;
  openRegistrationDialog: (onSuccess?: (user: { username: string }) => void) => void;
  closeRegistrationDialog: () => void;
  onRegistrationSuccess?: (user: { username: string }) => void;
}

const UserRegistrationContext = createContext<UserRegistrationContextType | undefined>(undefined);

export const useUserRegistration = () => {
  const context = useContext(UserRegistrationContext);
  if (!context) {
    throw new Error('useUserRegistration must be used within a UserRegistrationProvider');
  }
  return context;
};

interface UserRegistrationProviderProps {
  children: ReactNode;
}

export const UserRegistrationProvider: React.FC<UserRegistrationProviderProps> = ({ children }) => {
  const [showRegistrationDialog, setShowRegistrationDialog] = useState(false);
  const [onRegistrationSuccess, setOnRegistrationSuccess] = useState<((user: { username: string }) => void) | undefined>();

  const openRegistrationDialog = (onSuccess?: (user: { username: string }) => void) => {
    setOnRegistrationSuccess(() => onSuccess);
    setShowRegistrationDialog(true);
  };

  const closeRegistrationDialog = () => {
    setShowRegistrationDialog(false);
    setOnRegistrationSuccess(undefined);
  };

  return (
    <UserRegistrationContext.Provider
      value={{
        showRegistrationDialog,
        openRegistrationDialog,
        closeRegistrationDialog,
        onRegistrationSuccess,
      }}
    >
      {children}
    </UserRegistrationContext.Provider>
  );
};
