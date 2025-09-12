# Ecommerce POC Backend

A comprehensive ecommerce backend API built with Node.js, TypeScript, Express, TypeORM, PostgreSQL, and Redis.

## 🚀 Features

### Authentication & User Management
- **User Registration & Login** - JWT-based authentication with password hashing
- **Role-based Access Control** - Admin and User roles
- **Profile Management** - Users can update their profiles and change passwords
- **Session Management** - Redis-based session storage

### Product Management
- **Product CRUD** - Full product management with categories
- **Product Search & Filtering** - Advanced search with pagination
- **Featured Products** - Get featured products for homepage
- **Stock Management** - Track product inventory

### Category Management
- **Category CRUD** - Organize products into categories
- **Category Products** - Get all products in a specific category

### Shopping Cart
- **Add/Remove Items** - Manage cart items
- **Update Quantities** - Modify item quantities
- **Cart Persistence** - In-memory cart storage (can be moved to Redis/DB)

### Order Management
- **Order Creation** - Create orders from cart items
- **Order Tracking** - Track order status (pending, confirmed, shipped, delivered, cancelled)
- **Order History** - Users can view their order history
- **Admin Order Management** - Admins can manage all orders

### AI-Powered Features
- **Product Recommendations** - AI-powered personalized product suggestions using Gemini AI
- **Content Generation** - Automated product descriptions, titles, and marketing copy
- **Search Enhancement** - Improved search queries for better results
- **Sentiment Analysis** - Analysis of product reviews and customer feedback
- **Smart Categorization** - AI-assisted product categorization

### API Documentation
- **Swagger UI** - Interactive API documentation at `/api-docs`
- **OpenAPI 3.0** - Complete API specification

## 🛠️ Technology Stack

- **Backend**: Node.js, TypeScript, Express.js
- **Database**: PostgreSQL with TypeORM
- **Cache/Sessions**: Redis
- **Authentication**: JWT + bcryptjs
- **AI Integration**: Google Gemini AI
- **Documentation**: Swagger/OpenAPI
- **Validation**: class-validator
- **Testing**: Jest with comprehensive test coverage

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd ecommerce-poc-backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env` file in the root directory:
   ```env
   # Database
   DB_HOST=localhost
   DB_PORT=5432
   DB_USERNAME=your_username
   DB_PASSWORD=your_password
   DB_NAME=ecommerce_db

   # Redis
   REDIS_HOST=localhost
   REDIS_PORT=6379
   REDIS_PASSWORD=your_redis_password

   # JWT
   JWT_SECRET=your_jwt_secret_key
   SESSION_SECRET=your_session_secret

   # Server
   PORT=4000
   NODE_ENV=development
   API_URL=http://localhost:4000

   # AI Configuration
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

4. **Database Setup**
   - Create a PostgreSQL database
   - The application will automatically create tables on startup

5. **Seed Database** (Optional)
   ```bash
   npm run seed
   ```
   This creates sample data including:
   - Admin user (admin@example.com / admin123)
   - Regular user (user@example.com / user123)
   - Sample categories and products

## 🚀 Running the Application

### Development
```bash
npm run dev
```

### Production
```bash
npm run build
npm start
```

## 📚 API Endpoints

### Authentication
- `POST /auth/register` - User registration
- `POST /auth/login` - User login
- `POST /auth/logout` - User logout

### Users
- `GET /api/v1/users/profile` - Get user profile
- `PUT /api/v1/users/profile` - Update user profile
- `POST /api/v1/users/change-password` - Change password

### Products
- `GET /api/v1/products` - List all products
- `GET /api/v1/products/search` - Search products with filters
- `GET /api/v1/products/featured` - Get featured products
- `GET /api/v1/products/:id` - Get product by ID
- `POST /api/v1/products` - Create product (Admin)
- `PUT /api/v1/products/:id` - Update product (Admin)
- `DELETE /api/v1/products/:id` - Delete product (Admin)

### Categories
- `GET /api/v1/categories` - List all categories
- `GET /api/v1/categories/:id` - Get category by ID
- `GET /api/v1/categories/:id/products` - Get products in category
- `POST /api/v1/categories` - Create category (Admin)
- `PUT /api/v1/categories/:id` - Update category (Admin)
- `DELETE /api/v1/categories/:id` - Delete category (Admin)

### Cart
- `GET /api/v1/cart` - Get user cart
- `POST /api/v1/cart/items` - Add item to cart
- `PUT /api/v1/cart/items/:productId` - Update cart item
- `DELETE /api/v1/cart/items/:productId` - Remove item from cart
- `POST /api/v1/cart/clear` - Clear cart

### Orders
- `POST /api/v1/orders` - Create order
- `GET /api/v1/orders` - Get user orders
- `GET /api/v1/orders/:id` - Get order by ID
- `POST /api/v1/orders/:id/cancel` - Cancel order
- `GET /api/v1/orders/all` - Get all orders (Admin)
- `PUT /api/v1/orders/:id/status` - Update order status (Admin)

### AI Features
- `GET /api/v1/ai/health` - Check AI service health
- `POST /api/v1/ai/recommendations` - Get product recommendations
- `POST /api/v1/ai/content` - Generate content (descriptions, titles, etc.)
- `POST /api/v1/ai/search/enhance` - Enhance search queries
- `POST /api/v1/ai/sentiment` - Analyze product sentiment
- `GET /api/v1/ai/products/:id/recommendations` - Get product-specific recommendations
- `GET /api/v1/ai/categories/:id/recommendations` - Get category-specific recommendations

## 🔐 Authentication

The API uses JWT tokens for authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## 📖 API Documentation

Visit `http://localhost:4000/api-docs` for interactive API documentation.

## 🧪 Testing

### Run Tests
```bash
# Run all tests
npm test

# Run AI tests only
npm run test:ai

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

### Test AI Integration
```bash
# Test AI functionality with real API
npm run ai:test
```

**Note**: AI tests require a valid `GEMINI_API_KEY` in your `.env` file.

## 🗄️ Database Schema

### Users
- id (UUID, Primary Key)
- username (Unique)
- email (Unique)
- password (Hashed)
- role (admin/user)
- firstName, lastName, phone
- isActive, createdAt, updatedAt

### Categories
- id (UUID, Primary Key)
- name (Unique)
- description, imageUrl
- isActive, createdAt, updatedAt

### Products
- id (UUID, Primary Key)
- name, description, price
- stockQuantity, sku
- imageUrl, isAvailable
- categoryId (Foreign Key)
- createdAt, updatedAt

### Orders
- id (UUID, Primary Key)
- orderNumber (Unique)
- userId (Foreign Key)
- status (pending/confirmed/shipped/delivered/cancelled)
- totalAmount, shippingCost, taxAmount
- shippingAddress, shippingCity, shippingPostalCode, shippingCountry
- notes, createdAt, updatedAt

### Order Items
- id (UUID, Primary Key)
- orderId (Foreign Key)
- productId (Foreign Key)
- quantity, unitPrice, totalPrice

## 🚧 Improvements Made

1. **Security Enhancements**
   - Proper password hashing with bcryptjs
   - Database-stored users instead of hardcoded
   - JWT token validation with Redis storage

2. **New Features Added**
   - User registration and profile management
   - Product categories and search functionality
   - Shopping cart with in-memory storage
   - Complete order management system
   - Advanced product filtering and pagination

3. **Code Quality**
   - Proper TypeScript types and interfaces
   - Comprehensive error handling
   - Swagger documentation for all endpoints
   - Clean architecture with services and controllers

## 🔄 Future Enhancements

- [ ] Database-based cart storage
- [ ] Email notifications
- [ ] Payment integration
- [ ] File upload for product images
- [ ] Advanced analytics and reporting
- [ ] Rate limiting and API throttling
- [ ] Unit and integration tests
- [ ] Docker containerization
- [ ] CI/CD pipeline

## 📝 License

ISC
