import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Typography,
  IconButton,
  Chip,
  Alert,
  CircularProgress,
  Pagination
} from '@mui/material';
import { Add, Edit, Delete, Refresh, Restore } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { feedsAPI, importAPI } from '../utils/api';

const Feeds = () => {
  const { t } = useTranslation();
  const [feeds, setFeeds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [dialog_error, setDialogError] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [editingFeed, setEditingFeed] = useState(null);
  const [formData, setFormData] = useState({ name: '', url: '', description: '' });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showDeleted, setShowDeleted] = useState(false);
  const limit = 10;

  useEffect(() => {
    fetchFeeds();
  }, [page, showDeleted]);

  const fetchFeeds = async () => {
    setLoading(true);
    setError('');
    try {
      const params = { 
        offset: (page - 1) * limit, 
        limit,
        status: showDeleted ? 0 : 1
      };
      const response = await feedsAPI.list(params);
      setFeeds(response.data.feeds || []);
      // Calculate total pages (simplified - you might want to get total count from API)
      setTotalPages(Math.ceil((response.data.pagination?.count || 0) / limit) || 1);
    } catch (err) {
      setError(err.message || t('failed_to_fetch_feeds'));
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (feed = null) => {
    if (feed) {
      setEditingFeed(feed);
      setFormData({ name: feed.name, url: feed.url, description: feed.description || '' });
    } else {
      setEditingFeed(null);
      setFormData({ name: '', url: '', description: '' });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingFeed(null);
    setFormData({ name: '', url: '', description: '' });
  };

  const handleSubmit = async () => {
    try {
      setDialogError('');
      if (editingFeed) {
        await feedsAPI.update(editingFeed.id, formData);
      } else {
        await feedsAPI.create(formData);
      }
      handleCloseDialog();
      fetchFeeds();
    } catch (err) {
      let errorMessage = err.message || t('failed_to_save_feed');
      
      // Provide more specific error messages
      if (err.status === 403 || err.errorCode === 403) {
        errorMessage = t('access_forbidden_session_expired');
      } else if (err.status === 401 || err.errorCode === 208 || err.errorCode === 209) {
        errorMessage = t('session_expired_please_login');
      } else if (err.errorCode === 301) {
        errorMessage = t('invalid_feed_url_format_check_and_try_again');
      } else if (err.errorCode === 302) {
        errorMessage = t('invalid_rss_feed_format_verify_url');
      } else if (err.errorCode === 304) {
        errorMessage = t('feed_with_url_already_exists');
      }
      
      setDialogError(errorMessage);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm(t('are_you_sure_you_want_to_delete_this_feed'))) {
      try {
        await feedsAPI.delete(id);
        fetchFeeds();
      } catch (err) {
        setError(err.message || t('failed_to_delete_feed'));
      }
    }
  };

  const handleRestore = async (id) => {
    if (window.confirm(t('are_you_sure_you_want_to_restore_this_feed'))) {
      try {
        await feedsAPI.restore(id);
        fetchFeeds();
      } catch (err) {
        setError(err.message || t('failed_to_restore_feed') || 'Failed to restore feed');
      }
    }
  };

  const handleImport = async (feedId) => {
    try {
      setLoading(true);
      await importAPI.importFeed(feedId);
      fetchFeeds();
      alert(t('feed_imported_successfully'));
    } catch (err) {
      setError(err.message || t('failed_to_import_feed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">{t('feeds')}</Typography>
        <Box display="flex" gap={2}>
          <Button
            variant={showDeleted ? 'outlined' : 'contained'}
            onClick={() => setShowDeleted(!showDeleted)}
          >
            {showDeleted ? t('show_active') || 'Show Active' : t('show_deleted') || 'Show Deleted'}
          </Button>
          {!showDeleted && (
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => handleOpenDialog()}
            >
              {t('add_feed')}
            </Button>
          )}
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>{t('name')}</TableCell>
              <TableCell>{t('url')}</TableCell>
              <TableCell>{t('status')}</TableCell>
              <TableCell>{t('last_fetched')}</TableCell>
              <TableCell>{t('total_articles')}</TableCell>
              <TableCell align="right">{t('actions')}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading && feeds.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : feeds.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  {t('no_feeds_found')}
                </TableCell>
              </TableRow>
            ) : (
              feeds.map((feed) => (
                <TableRow key={feed.id}>
                  <TableCell>{feed.name}</TableCell>
                  <TableCell>
                    <a href={feed.url} target="_blank" rel="noopener noreferrer">
                      {feed.url}
                    </a>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={feed.status === 1 ? t('active') : t('inactive', { defaultValue: 'Inactive' })}
                      color={feed.status === 1 ? 'success' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {feed.last_fetched
                      ? new Date(feed.last_fetched).toLocaleString()
                      : t('never')}
                  </TableCell>
                  <TableCell>{feed.total_feedarticles || 0}</TableCell>
                  <TableCell align="right">
                    {feed.status === 1 ? (
                      <>
                        <IconButton
                          size="small"
                          onClick={() => handleImport(feed.id)}
                          title={t('import_feed')}
                        >
                          <Refresh />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleOpenDialog(feed)}
                          title={t('edit')}
                        >
                          <Edit />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleDelete(feed.id)}
                          title={t('delete')}
                          color="error"
                        >
                          <Delete />
                        </IconButton>
                      </>
                    ) : (
                      <IconButton
                        size="small"
                        onClick={() => handleRestore(feed.id)}
                        title={t('restore') || 'Restore'}
                        color="primary"
                      >
                        <Restore />
                      </IconButton>
                    )}
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
        <DialogTitle>{editingFeed ? t('edit_feed') : t('add_new_feed')}</DialogTitle>
        <DialogContent>
          {dialog_error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setDialogError('')}>
              {t(`${dialog_error}`)}
            </Alert>
          )}
          <TextField
            autoFocus
            margin="dense"
            label={t('feed_name')}
            fullWidth
            variant="outlined"
            value={formData.name}
            onChange={(e) => {
              const value = e.target.value
                .replace(/^\s+/, '')
                .replace(/\s{2,}/g, ' ');
              setFormData({ ...formData, name: value });
            }}
            onBlur={() =>
              setFormData((prev) => ({ ...prev, name: prev.name.trim() }))
            }
            sx={{ mb: 2 }}
            required
          />
          <TextField
            margin="dense"
            label={t('rss_feed_url')}
            fullWidth
            variant="outlined"
            value={formData.url}
            onChange={(e) => setFormData({ ...formData, url: e.target.value })}
            sx={{ mb: 2 }}
            placeholder="https://asharq.com/readwhere/rss.xml"
            required
          />
          <TextField
            margin="dense"
            label={t('description')}
            fullWidth
            variant="outlined"
            multiline
            rows={3}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>{t('cancel')}</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingFeed ? t('update') : t('create')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Feeds;

