import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Chip,
  Alert,
  CircularProgress,
  Pagination,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  InputAdornment,
  IconButton
} from '@mui/material';
import { Close } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { feedArticlesAPI, feedsAPI } from '../utils/api';

const FeedArticles = () => {
  const { t } = useTranslation();
  const [feedArticles, setFeedArticles] = useState([]);
  const [feeds, setFeeds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [imageErrors, setImageErrors] = useState({});
  const [filters, setFilters] = useState({
    feed_id: 'all',
    status: '',
    search: ''
  });
  const [searchInput, setSearchInput] = useState('');
  const limit = 10;

  useEffect(() => {
    fetchFeeds();
  }, []);

  useEffect(() => {
    fetchFeedArticles();
  }, [page, filters]);

  // Reset to page 1 when filters change (but not on initial mount)
  const prevFiltersRef = useRef(filters);
  useEffect(() => {
    if (prevFiltersRef.current.feed_id !== filters.feed_id || 
        prevFiltersRef.current.status !== filters.status ||
        prevFiltersRef.current.search !== filters.search) {
      setPage(1);
    }
    prevFiltersRef.current = filters;
  }, [filters.feed_id, filters.status, filters.search]);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters(prev => ({ ...prev, search: searchInput.trim() }));
    }, 500); // 500ms debounce

    return () => clearTimeout(timer);
  }, [searchInput]);

  const fetchFeeds = async () => {
    try {
      const response = await feedsAPI.list({ limit: 100 });
      setFeeds(response.data.feeds || []);
    } catch (err) {
      console.error('Failed to fetch feeds:', err);
    }
  };

  const fetchFeedArticles = async () => {
    setLoading(true);
    setError('');
    try {
      const params = {
        offset: (page - 1) * limit,
        limit,
        ...filters
      };
      // Remove empty filters
      Object.keys(params).forEach(key => {
        if (
          params[key] === '' ||
          params[key] === 'all' ||
          params[key] === null ||
          params[key] === undefined
        ) {
          delete params[key];
        }
      });
      
      // Rename search to title if backend expects 'title' parameter
      if (params.search) {
        params.title = params.search;
        delete params.search;
      }

      const response = await feedArticlesAPI.list(params);
      setFeedArticles(response.data.feedArticles || []);
      const pagination = response.data.pagination || {};
      setTotalCount(pagination.total || 0);
      setTotalPages(pagination.totalPages || Math.ceil((pagination.total || 0) / limit) || 1);
    } catch (err) {
      setError(err.message || t('failed_to_fetch_feed_articles', { defaultValue: 'Failed to fetch feed articles' }));
    } finally {
      setLoading(false);
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 1:
        return t('published', { defaultValue: 'Published' });
      case 0:
        return t('draft', { defaultValue: 'Draft' });
      case -1:
        return t('archived', { defaultValue: 'Archived' });
      default:
        return t('unknown', { defaultValue: 'Unknown' });
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 1:
        return 'success';
      case 0:
        return 'warning';
      case -1:
        return 'default';
      default:
        return 'default';
    }
  };

  const getGameLabel = (gameType) => {
    const gameLabels = {
      'headline_scramble': t('headline_scramble'),
      'quiz': t('quiz'),
      'hangman': t('hangman'),
      'crossword': t('crossword')
    };
    return gameLabels[gameType] || gameType;
  };

  const handleClearSearch = () => {
    setSearchInput('');
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">{t('feed_articles')}</Typography>
      </Box>

      <Paper sx={{ p: 2, mb: 2 }}>
        <Box display="flex" gap={2} flexWrap="wrap">
          <TextField
            sx={{ minWidth: 300, flexGrow: 1 }}
            label={t('search_by_title', { defaultValue: 'Search by Title' })}
            variant="outlined"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder={t('enter_article_title', { defaultValue: 'Enter article title...' })}
            InputProps={{
              endAdornment: searchInput && (
                <InputAdornment position="end">
                  <IconButton
                    aria-label={t('clear_search', { defaultValue: 'Clear search' })}
                    onClick={handleClearSearch}
                    edge="end"
                    size="small"
                  >
                    <Close />
                  </IconButton>
                </InputAdornment>
              )
            }}
          />
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel>{t('filter_by_feed')}</InputLabel>
            <Select
              value={filters.feed_id}
              label={t('filter_by_feed')}
              onChange={(e) => setFilters({ ...filters, feed_id: e.target.value })}
            >
              <MenuItem value="all">{t('all_feeds')}</MenuItem>
              {feeds.map((feed) => (
                <MenuItem key={feed.id} value={feed.id}>
                  {feed.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl sx={{ minWidth: 200, display: 'none' }}>
            <InputLabel>Filter by Status</InputLabel>
            <Select
              value={filters.status}
              label="Filter by Status"
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            >
              <MenuItem value="">All Status</MenuItem>
              <MenuItem value="1">Published</MenuItem>
              <MenuItem value="0">Draft</MenuItem>
              <MenuItem value="-1">Archived</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>{t('image')}</TableCell>
              <TableCell>{t('title')}</TableCell>
              <TableCell>{t('feed')}</TableCell>
              <TableCell>{t('published_date')}</TableCell>
              <TableCell sx={{ display: 'none' }}>{t('status')}</TableCell>
              <TableCell>{t('games')}</TableCell>
              <TableCell>{t('link')}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading && feedArticles.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : feedArticles.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  {t('no_feed_articles_found', { defaultValue: 'No feed articles found.' })}
                </TableCell>
              </TableRow>
            ) : (
              feedArticles.map((article) => (
                <TableRow key={article.id}>
                  <TableCell>
                    <Box
                      sx={{
                        width: 80,
                        height: 60,
                        borderRadius: 1,
                        overflow: 'hidden',
                        bgcolor: 'grey.200',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      {article.image_url && !imageErrors[article.id] ? (
                        <Box
                          component="img"
                          src={article.image_url}
                          alt={article.title}
                          sx={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            cursor: 'pointer',
                            '&:hover': {
                              opacity: 0.8
                            }
                          }}
                          onClick={() => window.open(article.image_url, '_blank')}
                          onError={() => {
                            setImageErrors(prev => ({ ...prev, [article.id]: true }));
                          }}
                        />
                      ) : (
                        <Typography variant="caption" color="text.secondary">
                          {t('no_image', { defaultValue: 'No Image' })}
                        </Typography>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight="medium">
                      {article.title}
                    </Typography>
                    {article.description && (
                      <Typography variant="caption" color="text.secondary">
                        {article.description.substring(0, 100)}...
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    {article.feed_id?.name || t('unknown', { defaultValue: 'Unknown' })}
                  </TableCell>
                  <TableCell>
                    {article.published_date
                      ? new Date(article.published_date).toLocaleString()
                      : t('n_a', { defaultValue: 'N/A' })}
                  </TableCell>
                  <TableCell sx={{ display: 'none' }}>
                    <Chip
                      label={getStatusLabel(article.status)}
                      color={getStatusColor(article.status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {article.hasGames && article.games && article.games.length > 0 ? (
                      <Box display="flex" gap={0.5} flexWrap="wrap">
                        {article.games.map((gameType, index) => (
                          <Chip
                            key={index}
                            label={getGameLabel(gameType)}
                            size="small"
                            color="success"
                            variant="outlined"
                          />
                        ))}
                      </Box>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        {t('no_games')}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <a
                      href={article.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ textDecoration: 'none' }}
                    >
                      {t('view')}
                    </a>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {totalPages > 1 && (
        <Box display="flex" justifyContent="space-between" alignItems="center" mt={3}>
          <Typography variant="body2" color="text.secondary">
            {t('showing_articles', { 
              start: ((page - 1) * limit) + 1, 
              end: Math.min(page * limit, totalCount), 
              total: totalCount,
              defaultValue: `Showing ${((page - 1) * limit) + 1} to ${Math.min(page * limit, totalCount)} of ${totalCount} articles`
            })}
          </Typography>
          <Pagination
            count={totalPages}
            page={page}
            onChange={(e, value) => {
              setPage(value);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            color="primary"
          />
        </Box>
      )}
    </Box>
  );
};

export default FeedArticles;

