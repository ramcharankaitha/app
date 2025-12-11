# Anitha Stores Backend API

## Setup Instructions

### 1. Install PostgreSQL
- Download and install PostgreSQL from https://www.postgresql.org/download/
- During installation, remember the password you set for the `postgres` user
- Make sure PostgreSQL service is running

### 2. Create Database
Open PostgreSQL command line (psql) or pgAdmin and run:
```sql
CREATE DATABASE anitha_stores;
```

### 3. Configure Environment Variables
Create a `.env` file in the `server` directory:
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=anitha_stores
DB_USER=postgres
DB_PASSWORD=your_postgres_password_here

PORT=5000
NODE_ENV=development

JWT_SECRET=your_jwt_secret_key_here
```

### 4. Install Dependencies
```bash
cd server
npm install
```

### 5. Start the Server
```bash
npm start
# or for development with auto-reload
npm run dev
```

The server will:
- Connect to PostgreSQL database
- Initialize the database schema automatically
- Create default admin profile and stores
- Start listening on http://localhost:5000

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

## Default Credentials
- Email: `admin@anithastores.com`
- Password: `admin123`

