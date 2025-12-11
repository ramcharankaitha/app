# Anitha Stores - Admin Dashboard

A modern React.js admin dashboard application with PostgreSQL backend for managing stores, users, staff, and products.

## Features

- 🔐 Secure login system
- 👥 User and Staff management
- 📦 Product inventory management
- 🏪 Store management
- ⚙️ Settings and profile management
- 📊 Dashboard with analytics
- 🎨 Modern red & white theme UI

## Tech Stack

### Frontend
- React.js 18
- CSS3 (Custom styling)
- Font Awesome icons

### Backend
- Node.js
- Express.js
- PostgreSQL
- bcryptjs (password hashing)
- JWT (authentication)

## Prerequisites

Before you begin, ensure you have installed:
- Node.js (v14 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn

## Installation

### 1. Clone the repository
```bash
git clone <repository-url>
cd app
```

### 2. Install Frontend Dependencies
```bash
npm install
```

### 3. Install Backend Dependencies
```bash
cd server
npm install
cd ..
```

### 4. Set Up PostgreSQL Database

See [DATABASE_SETUP.md](./DATABASE_SETUP.md) for detailed database setup instructions.

Quick setup:
1. Install PostgreSQL
2. Create database: `CREATE DATABASE anitha_stores;`
3. Configure `server/.env` file with your database credentials

### 5. Configure Environment Variables

Create `server/.env` file:
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=anitha_stores
DB_USER=postgres
DB_PASSWORD=your_password_here

PORT=5000
NODE_ENV=development

JWT_SECRET=your_jwt_secret_key_here
```

## Running the Application

### Option 1: Run Frontend and Backend Separately

**Terminal 1 - Backend:**
```bash
cd server
npm start
# or for development
npm run dev
```

**Terminal 2 - Frontend:**
```bash
npm start
```

### Option 2: Run Both Together (Recommended)

From the root directory:
```bash
npm run dev
```

This will start:
- Backend API server on http://localhost:5000
- React frontend on http://localhost:3000

## Default Login Credentials

- **Email:** `admin@anithastores.com`
- **Password:** `admin123`

## Project Structure

```
app/
├── public/              # Public assets
├── src/                 # React source code
│   ├── components/      # React components
│   ├── services/        # API services
│   └── index.js         # Entry point
├── server/              # Backend server
│   ├── config/          # Configuration files
│   ├── database/        # Database schema and init
│   ├── routes/          # API routes
│   └── server.js        # Server entry point
└── package.json         # Frontend dependencies
```

## Available Scripts

### Frontend
- `npm start` - Start React development server
- `npm build` - Build for production
- `npm test` - Run tests

### Backend
- `npm run server` - Start backend server
- `npm run server:dev` - Start backend with auto-reload

### Combined
- `npm run dev` - Run both frontend and backend together

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login

### Users
- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get user by ID
- `POST /api/users` - Create new user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Staff
- `GET /api/staff` - Get all staff
- `POST /api/staff` - Create new staff

### Products
- `GET /api/products` - Get all products
- `POST /api/products` - Create new product

### Profile
- `GET /api/profile` - Get admin profile
- `PUT /api/profile` - Update admin profile

## Development

### Adding New Features

1. Create component in `src/components/`
2. Add route in `src/App.js`
3. Create API endpoint in `server/routes/`
4. Update database schema if needed in `server/database/schema.sql`

### Database Migrations

The database schema is automatically initialized on server start. To modify:
1. Update `server/database/schema.sql`
2. Restart the server (schema is recreated)

## Troubleshooting

### Database Connection Issues
- Verify PostgreSQL is running
- Check `.env` file credentials
- Ensure database `anitha_stores` exists

### Port Already in Use
- Change `PORT` in `server/.env`
- Or kill the process using the port

### CORS Errors
- Backend CORS is configured for `localhost:3000`
- Update CORS settings in `server/server.js` if needed

## License

Private project - All rights reserved

## Support

For issues and questions, please contact the development team.
