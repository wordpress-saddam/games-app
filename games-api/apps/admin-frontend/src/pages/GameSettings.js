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
  InputLabel,
  Checkbox,
  FormGroup,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Pagination
} from '@mui/material';
import { Edit, Delete, Add } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { gameSettingsAPI, feedsAPI } from '../utils/api';

const GameSettings = () => {
  const { t } = useTranslation();
  
  const GAME_OPTIONS = [
    { value: 'headline_scramble', label: t('headline_scramble') },
    { value: 'quiz', label: t('quiz') },
    { value: 'hangman', label: t('hangman') },
    { value: 'crossword', label: t('crossword') }
  ];

  const LANGUAGE_OPTIONS = [
    { value: 'Arabic', label: t('arabic') },
    { value: 'English', label: t('english') }
  ];
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [dialog_error, setDialogError] = useState('');
  const [success, setSuccess] = useState('');
  const [feeds, setFeeds] = useState([{ id: 'all', name: t('all_feeds') }]);
  const [settings, setSettings] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingSettings, setEditingSettings] = useState(null);
  const [formData, setFormData] = useState({
    feed_id: 'all',
    enabled: false,
    language: 'Arabic',
    games: [],
    access_key: '',
    secret_key: ''
  });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 10;

  useEffect(() => {
    fetchFeeds();
    fetchSettings();
  }, [page]);

  const fetchFeeds = async () => {
    try {
      const response = await feedsAPI.list({ limit: 100 });
      setFeeds([{ id: 'all', name: t('all_feeds') }, ...(response.data.feeds || [])]);
    } catch (err) {
      console.error('Failed to fetch feeds:', err);
    }
  };

  const fetchSettings = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await gameSettingsAPI.list({ offset: (page - 1) * limit, limit });
      setSettings(response.data.settings || []);
      setTotalPages(Math.ceil((response.data.pagination?.count || 0) / limit) || 1);
    } catch (err) {
      setError(err.message || t('failed_to_fetch_game_settings', { defaultValue: 'Failed to fetch game settings' }));
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = async (setting = null) => {
    if (setting) {
      setEditingSettings(setting);
      // feed_id is now always a string from getPublicObject
      // Ensure feed_id is converted to string for Select component
      const feedId = setting.feed_id ? String(setting.feed_id) : '';
      setFormData({
        feed_id: feedId,
        enabled: setting.enabled || false,
        language: setting.language || 'Arabic',
        games: setting.games || [],
        access_key: setting.access_key || '',
        secret_key: setting.secret_key || ''
      });
    } else {
      setEditingSettings(null);
      setFormData({
        feed_id: 'all',
        enabled: false,
        language: 'Arabic',
        games: [],
        access_key: '',
        secret_key: ''
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingSettings(null);
    setFormData({
      feed_id: 'all',
      enabled: false,
      language: 'Arabic',
      games: [],
      access_key: '',
      secret_key: ''
    });
  };

  const handleGameToggle = (gameValue) => {
    setFormData(prev => {
      const games = prev.games.includes(gameValue)
        ? prev.games.filter(g => g !== gameValue)
        : [...prev.games, gameValue];
      return { ...prev, games };
    });
  };

  const handleSubmit = async () => {
    if (!formData.feed_id || formData.feed_id === 'all') {
      setDialogError(t('please_select_a_feed'));
      return;
    }

    if (formData.enabled && (!formData.access_key || !formData.secret_key)) {
      setDialogError(t('access_key_and_secret_key_required', { defaultValue: t('access_key_and_secret_key_required') }));
      return;
    }

    setLoading(true);
    setDialogError('');
    setSuccess('');

    try {
      await gameSettingsAPI.createOrUpdate(formData);
      setSuccess(t('game_settings_saved_successfully', { defaultValue: t('game_settings_saved_successfully') }));
      handleCloseDialog();
      fetchSettings();
    } catch (err) {
      setDialogError(err.message || t('failed_to_save_game_settings', { defaultValue: t('failed_to_save_game_settings') }));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (feedId) => {
    if (window.confirm(t('are_you_sure_you_want_to_delete_these_game_settings'))) {
      try {
        setLoading(true);
        await gameSettingsAPI.delete(feedId);
        setSuccess(t('game_settings_deleted_successfully'));
        fetchSettings();
      } catch (err) {
        setError(err.message || t('failed_to_delete_game_settings'));
      } finally {
        setLoading(false);
      }
    }
  };

  const getGameLabel = (gameValue) => {
    const game = GAME_OPTIONS.find(g => g.value === gameValue);
    return game ? game.label : gameValue;
  };

  // Step 1: create a Set of feed_ids already used in settings
  const usedFeedIds = new Set(
    settings.map((setting) => String(setting.feed_id))
  );

  // Step 2: filter feeds that are NOT in settings
  const availableFeeds = !editingSettings ? feeds.filter(
    (feed) => !usedFeedIds.has(String(feed.id || feed._id))
  ) : feeds;


  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">{t('game_settings')}</Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => handleOpenDialog()}
        >
          {t('add_settings')}
        </Button>
      </Box>

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

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
              <TableRow>
              <TableCell>{t('feed')}</TableCell>
              <TableCell>{t('enabled', { defaultValue: 'Enabled' })}</TableCell>
              <TableCell>{t('language')}</TableCell>
              <TableCell>{t('games')}</TableCell>
              <TableCell>{t('credentials')}</TableCell>
              <TableCell align="right">{t('actions')}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading && settings.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : settings.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  {t('no_game_settings_found', { defaultValue: t('no_game_settings_found') })}
                </TableCell>
              </TableRow>
            ) : (
              settings.map((setting) => (
                <TableRow key={setting.id}>
                  <TableCell>
                    {setting.feed_id_obj?.name || setting.feed_id?.name || t('unknown_feed', { defaultValue: t('unknown_feed') })}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={setting.enabled ? t('enabled', { defaultValue: t('enabled') }) : t('disabled', { defaultValue: t('disabled') })}
                      color={setting.enabled ? 'success' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{setting.language}</TableCell>
                  <TableCell>
                    {setting.games && setting.games.length > 0 ? (
                      <Box display="flex" gap={0.5} flexWrap="wrap">
                        {setting.games.map((game) => (
                          <Chip
                            key={game}
                            label={getGameLabel(game)}
                            size="small"
                            variant="outlined"
                          />
                        ))}
                      </Box>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        {t('no_games_selected', { defaultValue: t('no_games_selected') })}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    {setting.access_key && setting.secret_key ? (
                      <Chip
                        label={t('configured')}
                        color="success"
                        size="small"
                      />
                    ) : (
                      <Chip
                        label={t('not_set', { defaultValue: t('not_set') })}
                        color="warning"
                        size="small"
                      />
                    )}
                  </TableCell>
                  <TableCell align="right">
                    <IconButton
                      size="small"
                      onClick={() => handleOpenDialog(setting)}
                      title={t('edit')}
                    >
                      <Edit />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDelete(setting.feed_id)}
                      title={t('delete')}
                    >
                      <Delete />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {totalPages > 1 && (
        <Box display="flex" justifyContent="center" mt={3}>
          <Pagination
            count={totalPages}
            page={page}
            onChange={(e, value) => setPage(value)}
          />
        </Box>
      )}

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingSettings ? t('edit_game_settings') : t('add_game_settings')}
        </DialogTitle>
        <DialogContent>
          {dialog_error && (
              <Alert severity="error" sx={{ mb: 2 }} onClose={() => setDialogError('')}>
                {dialog_error}
              </Alert>
            )}
          <FormControl fullWidth sx={{ mb: 3, mt: 2 }}>
            <InputLabel>{t('select_feed')}</InputLabel>
            <Select
              value={formData.feed_id}
              label={t('select_feed')}
              onChange={(e) => setFormData({ ...formData, feed_id: e.target.value })}
              disabled={!!editingSettings}
            >
              <MenuItem value="all">{t('select_a_feed')}</MenuItem>
              {availableFeeds.map((feed) => {
                const feedId = String(feed.id || feed._id || '');
                return (
                  <MenuItem key={feedId} value={feedId}>
                    {feed.name}
                  </MenuItem>
                );
              })}
            </Select>
          </FormControl>

          <FormControlLabel
            sx={{ mb: 3 }}
            control={
              <Switch
                checked={formData.enabled}
                onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
              />
            }
            label={
              <Typography component="span" sx={{ cursor: 'default' }} >
                {t('enable_games_generation')}
              </Typography>
            }
          />

          <FormControl fullWidth sx={{ mb: 3 }}>
            <InputLabel>{t('language')}</InputLabel>
            <Select
              value={formData.language}
              label={t('language')}
              onChange={(e) => setFormData({ ...formData, language: e.target.value })}
            >
              {LANGUAGE_OPTIONS.map((lang) => (
                <MenuItem key={lang.value} value={lang.value}>
                  {lang.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
            {t('api_credentials')}
          </Typography>
          <TextField
            fullWidth
            label={t('access_key')}
            type="text"
            value={formData.access_key}
            onChange={(e) => setFormData({ ...formData, access_key: e.target.value })}
            margin="normal"
            helperText={t('api_access_key_for_games_generation')}
          />
          <TextField
            fullWidth
            label={t('secret_key')}
            type="password"
            value={formData.secret_key}
            onChange={(e) => setFormData({ ...formData, secret_key: e.target.value })}
            margin="normal"
            helperText={t('api_secret_key_for_games_generation')}
          />

          <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
            {t('select_games')}
          </Typography>
          <FormGroup>
            {GAME_OPTIONS.map((game) => (
              <FormControlLabel
                key={game.value}
                control={
                  <Checkbox
                    checked={formData.games.includes(game.value)}
                    onChange={() => handleGameToggle(game.value)}
                  />
                }
                label={game.label}
              />
            ))}
          </FormGroup>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>{t('cancel')}</Button>
          <Button onClick={handleSubmit} variant="contained" disabled={loading}>
            {loading ? t('saving') : editingSettings ? t('update') : t('create')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default GameSettings;

