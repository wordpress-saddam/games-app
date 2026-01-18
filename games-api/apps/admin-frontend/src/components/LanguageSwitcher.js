import React from 'react';
import { Button, ButtonGroup } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { changeLanguage } from '../i18n';

const LanguageSwitcher = () => {
  const { i18n } = useTranslation();

  const handleLanguageChange = (lang) => {
    changeLanguage(lang);
  };

  const isEnglish = i18n.language === 'en';
  const isArabic = i18n.language === 'ar';

  return (
    <ButtonGroup variant="outlined" size="small" sx={{ marginInlineStart: 2 }}>
      <Button
        onClick={() => handleLanguageChange('en')}
        variant={isEnglish ? 'contained' : 'outlined'}
        sx={{
          minWidth: 60,
          fontSize: '0.75rem',
          ...(isEnglish ? {
            backgroundColor: '#f5f5f5 !important',
            color: '#000000 !important',
            borderColor: '#ffffff !important',
            '&:hover': {
              backgroundColor: '#e0e0e0 !important',
              borderColor: '#ffffff !important',
            },
          } : {
            backgroundColor: 'transparent !important',
            color: '#ffffff !important',
            borderColor: '#ffffff !important',
            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 0.1) !important',
              borderColor: '#ffffff !important',
            },
          }),
        }}
      >
        EN
      </Button>
      <Button
        onClick={() => handleLanguageChange('ar')}
        variant={isArabic ? 'contained' : 'outlined'}
        sx={{
          minWidth: 60,
          fontSize: '0.75rem',
          ...(isArabic ? {
            backgroundColor: '#f5f5f5 !important',
            color: '#000000 !important',
            borderColor: '#ffffff !important',
            '&:hover': {
              backgroundColor: '#e0e0e0 !important',
              borderColor: '#ffffff !important',
            },
          } : {
            backgroundColor: 'transparent !important',
            color: '#ffffff !important',
            borderColor: '#ffffff !important',
            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 0.1) !important',
              borderColor: '#ffffff !important',
            },
          }),
        }}
      >
        AR
      </Button>
    </ButtonGroup>
  );
};

export default LanguageSwitcher;

