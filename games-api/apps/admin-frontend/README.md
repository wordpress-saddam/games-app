# Admin Dashboard Frontend

React frontend for the Asharq Games Management Admin Dashboard.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file (optional, defaults to localhost:5007):
```
REACT_APP_API_URL=http://localhost:5007/api/admin
```

3. Start the development server:
```bash
npm start
```

The app will open at `http://localhost:3000`

## Features

- User authentication (Register/Login)
- Feed management (CRUD operations)
- Feed articles viewing and management
- Import settings configuration
- Manual and scheduled feed imports
- Import history

## API Integration

The frontend connects to the backend API at `http://localhost:5007/api/admin` by default.

All API calls are handled through the `src/utils/api.js` file.

## Project Structure

```
src/
  ├── config.js          # API configuration
  ├── utils/
  │   └── api.js         # API helper functions
  ├── components/        # React components (to be created)
  ├── pages/             # Page components (to be created)
  └── App.js             # Main app component
```

## Next Steps

You'll need to create:
1. Login/Register pages
2. Dashboard layout
3. Feed management components
4. Feed articles listing
5. Settings page
6. Import controls

Consider using a UI library like Material-UI, Ant Design, or Tailwind CSS for faster development.
