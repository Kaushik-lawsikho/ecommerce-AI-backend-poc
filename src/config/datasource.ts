import "reflect-metadata";
import { DataSource } from "typeorm";
import { Product } from "../entities/product.entity";
import { User } from "../entities/user.entity";
import { Category } from "../entities/category.entity";
import { Order } from "../entities/order.entity";
import { OrderItem } from "../entities/order-item.entity";
import dotenv from "dotenv";
dotenv.config();

export const AppDataSource = new DataSource({
  type: "postgres",
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 5432),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  entities: [Product, User, Category, Order, OrderItem],
  synchronize: true, // dev only; use migrations in prod
  logging: false
});
