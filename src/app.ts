import express from "express";
import session from "express-session";
import RedisStore from "connect-redis";
import { redisClient } from "./config/redis";
import { requestLogger } from "./config/logger";
import productRoutes from "./routes/product.routes";
import authRoutes from "./routes/auth.routes";
import userRoutes from "./routes/user.routes";
import categoryRoutes from "./routes/category.routes";
import orderRoutes from "./routes/order.routes";
import cartRoutes from "./routes/cart.routes";
import aiRoutes from "./routes/ai.routes";
import swaggerUi from "swagger-ui-express";
import swaggerJsdoc from "swagger-jsdoc";
import dotenv from "dotenv";
dotenv.config();

const app = express();

app.use(express.json());

// Request logging middleware
app.use(requestLogger);

// session
app.use(session({
  store: new RedisStore({ client: redisClient }),
  secret: process.env.SESSION_SECRET || "secret",
  resave: false,
  saveUninitialized: false,
  cookie: { secure: process.env.NODE_ENV === "production" }
}));

app.get("/", (req, res) => {
  res.json({
    message: "Ecommerce API",
    version: "1.0.0",
    endpoints: {
      auth: "/auth",
      products: "/api/v1/products",
      categories: "/api/v1/categories",
      users: "/api/v1/users",
      orders: "/api/v1/orders",
      cart: "/api/v1/cart",
      ai: "/api/v1/ai",
      docs: "/api-docs"
    }
  });
});

// API routes
app.use("/auth", authRoutes);
app.use("/api/v1/products", productRoutes);
app.use("/api/v1/categories", categoryRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/orders", orderRoutes);
app.use("/api/v1/cart", cartRoutes);
app.use("/api/v1/ai", aiRoutes);

// swagger setup
const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Ecommerce API",
      version: "1.0.0",
      description: "Ecommerce API with JWT authentication, user management, product catalog, categories, and order management"
    },
    servers: [
      {
        url: process.env.API_URL || "http://localhost:4000",
        description: "Development server"
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT"
        }
      }
    }
  },
  apis: ["./src/controllers/*.ts", "./src/routes/*.ts"]
});

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

export default app;
