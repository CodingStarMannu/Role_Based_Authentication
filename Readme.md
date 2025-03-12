# Role-Based Access Control (RBAC) API

A Node.js REST API with JWT authentication and role-based access control using MSSQL with Sequelize ORM.

## Features

- **Role Management**
  - SuperAdmin can create roles (user, admin, superAdmin)
  - API to fetch all available roles

- **User Management**
  - Create users with specific roles
  - SuperAdmin can create SuperAdmin, Admin, or User accounts
  - SuperAdmin can view, block, or unblock users they created
  - Users can only see their child users

- **Authentication & Authorization**
  - JWT-based authentication
  - Middleware to authorize actions based on roles
  - Hierarchical permission structure

## Technology Stack

- Node.js & Express
- MSSQL Database
- Sequelize ORM
- JWT for Authentication
- Docker (optional)

## Prerequisites

- Node.js (v14+)
- MSSQL Server
- Docker & Docker Compose (optional)

## Installation

### Option 1: Local Setup

1. Clone the repository:
   ```bash
   git clone <https://github.com/CodingStarMannu/Role_Based_Authentication>
   cd Role_Based_Authentication
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory with the following contents:
   ```
   PORT=5000
   NODE_ENV=development
   DB_HOST=mssql
   DB_USER=sa
   DB_PASS=P@ssw0rd123!
   DB_NAME=rbac_db
   DB_PORT=1433
   JWT_SECRET=your_secret_key
   ```

4. Run database migrations:
   ```bash
   npx sequelize-cli db:migrate
   ```

5. Seed the SuperAdmin user:
   ```bash
   node scripts/seedAdmin.js
   ```

6. Start the server:
   ```bash
   npm run dev
   ```

### Option 2: Docker Setup

1. Make sure Docker and Docker Compose are installed
2. Run the application:
   ```bash
   docker-compose up -d
   ```
3. Seed the SuperAdmin user:
   ```bash
   docker exec -it node-app bash
   node scripts/seedAdmin.js
   ```

## API Endpoints

### Authentication

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | /api/users/login | User login | Public |

### Roles

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | /api/roles | Create a new role | SuperAdmin only |
| GET | /api/roles | Get all roles | Any authenticated user |

### Users

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | /api/users/register | Register a new user | Any authenticated user (with role restrictions) |
| GET | /api/users | Get all users (filtered by hierarchy) | Any authenticated user |
| GET | /api/users/:userId | Get user by ID | Only if user has permission |
| PATCH | /api/users/:userId/status | Block/unblock a user | Only if user has permission |

## Testing with Postman

### 1. User Login
```json
POST /api/users/login
{
  "email": "superadmin@example.com",
  "password": "SuperAdmin@123"
}
```

### 2. Create Role (SuperAdmin only)
```json
POST /api/roles
Authorization: Bearer <token>
{
  "name": "manager"
}
```

### 3. Register User
```json
POST /api/users/register
Authorization: Bearer <token>
{
  "name": "John Admin",
  "email": "admin@example.com",
  "password": "Admin@123",
  "roleId": 2
}
```

### 4. Block User
```json
PATCH /api/users/:userId/status
Authorization: Bearer <token>
{
  "status": "blocked"
}
```

## Default SuperAdmin Credentials

After running the seed script, you can use these credentials to log in:
- Email: superadmin@example.com
- Password: SuperAdmin@123

## Project Structure

```
mssql-rbac-app/
├── app.js                # Main Express application
├── controllers/          # Request handlers
│   ├── roleController.js
│   └── userController.js
├── middleware/           # Authentication middleware
│   └── auth.js
├── models/               # Sequelize models
│   ├── index.js
│   ├── role.js
│   └── user.js
├── routes/               # API routes
│   ├── index.js
│   ├── roleRoutes.js
│   └── userRoutes.js
├── scripts/              # Utility scripts
│   └── seedAdmin.js
├── .env                  # Environment variables
├── .gitignore            # Files to ignore in git
├── package.json          # Project dependencies
└── README.md             # Project documentation
```

## Role Hierarchy

1. **SuperAdmin**
   - Can create all types of users (SuperAdmin, Admin, User)
   - Can view, block, or unblock any user
   - Can create roles

2. **Admin**
   - Can create Admin and User accounts
   - Can only manage users they created

3. **User**
   - Limited access
   - Can only see their child users

## License

MIT