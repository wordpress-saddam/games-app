import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  FormControlLabel,
  Switch,
  Select,
  MenuItem,
  FormControl,
  InputLabel
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { settingsAPI, feedsAPI } from '../utils/api';

const Settings = () => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [feeds, setFeeds] = useState([]);
  const [selectedFeedId, setSelectedFeedId] = useState('all');
  const [settings, setSettings] = useState({
    import_interval_minutes: 60,
    auto_import: true,
    max_feedarticles_per_import: 50
  });

  useEffect(() => {
    fetchFeeds();
  }, []);

  useEffect(() => {
    if (selectedFeedId && selectedFeedId !== 'all') {
      fetchSettings();
    }
  }, [selectedFeedId]);

  const fetchFeeds = async () => {
    try {
      const response = await feedsAPI.list({ limit: 100 });
      setFeeds(response.data.feeds || []);
    } catch (err) {
      console.error('Failed to fetch feeds:', err);
    }
  };

  const fetchSettings = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await settingsAPI.get(selectedFeedId);
      setSettings(response.data);
    } catch (err) {
      setError(err.message || t('failed_to_fetch_settings'));
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!selectedFeedId || selectedFeedId === 'all') {
      setError(t('please_select_a_feed', { defaultValue: 'Please select a feed' }));
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await settingsAPI.update({
        feedId: selectedFeedId,
        ...settings
      });
      setSuccess(t('settings_saved_successfully'));
    } catch (err) {
      setError(err.message || t('failed_to_save_settings'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        {t('feed_settings')}
      </Typography>

      <Paper sx={{ p: 3, mt: 3 }}>
        <FormControl fullWidth sx={{ mb: 3 }}>
          <InputLabel>{t('select_feed')}</InputLabel>
          <Select
            value={selectedFeedId}
            label={t('select_feed')}
            onChange={(e) => setSelectedFeedId(e.target.value)}
          >
            <MenuItem value="all">{t('select_a_feed')}</MenuItem>
            {feeds.map((feed) => (
              <MenuItem key={feed.id} value={feed.id}>
                {feed.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {loading && !settings.import_interval_minutes ? (
          <Box display="flex" justifyContent="center" p={3}>
            <CircularProgress />
          </Box>
        ) : selectedFeedId && selectedFeedId !== 'all' ? (
          <>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
                {error}
              </Alert>
            )}

            {success && (
              <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
                {success}
              </Alert>
            )}

            <TextField
              fullWidth
              label={t('import_interval_minutes')}
              type="number"
              value={settings.import_interval_minutes}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  import_interval_minutes: parseInt(e.target.value) || 60
                })
              }
              helperText={t('minimum_5_minutes')}
              inputProps={{ min: 5 }}
              sx={{ mb: 3 }}
            />

            <FormControlLabel
              control={
                <Switch
                  checked={settings.auto_import}
                  onChange={(e) =>
                    setSettings({ ...settings, auto_import: e.target.checked })
                  }
                />
              }
              label={t('enable_auto_import')}
              sx={{ mb: 3, display: 'block' }}
            />

            {/* <TextField
              fullWidth
              label={t('max_articles_per_import')}
              type="number"
              value={settings.max_feedarticles_per_import}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  max_feedarticles_per_import: parseInt(e.target.value) || 50
                })
              }
              helperText={t('maximum_number_of_articles_to_import_per_run')}
              inputProps={{ min: 1 }}
              sx={{ mb: 3 }}
            /> */}

            <TextField
              fullWidth
              label={t('max_articles_per_import')}
              type="number"
              value={settings.max_feedarticles_per_import}
              onChange={(e) => {
                const value = Number(e.target.value);

                setSettings({
                  ...settings,
                  max_feedarticles_per_import: Math.min(
                    1000,
                    Math.max(1, value || 1)
                  )
                });
              }}
              helperText={t('maximum_number_of_articles_to_import_per_run')}
              slotProps={{
                input: {
                  min: 1,
                  max: 1000
                }
              }}
              sx={{ mb: 3 }}
            />

            <Button
              variant="contained"
              onClick={handleSave}
              disabled={loading}
              size="large"
            >
              {loading ? t('saving') : t('save_settings')}
            </Button>
          </>
        ) : (
          <Typography variant="body1" color="text.secondary">
            {t('please_select_a_feed_to_configure_its_settings', { defaultValue: 'Please select a feed to configure its settings.' })}
          </Typography>
        )}
      </Paper>
    </Box>
  );
};

export default Settings;

