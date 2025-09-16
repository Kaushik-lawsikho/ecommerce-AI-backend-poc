import { AppDataSource } from "../config/datasource";
import { User, UserRole } from "../entities/user.entity";
import { Category } from "../entities/category.entity";
import { Product } from "../entities/product.entity";
import bcrypt from "bcryptjs";
import { createModuleLogger, eventLogger, errorLogger } from "../config/logger";

const logger = createModuleLogger('seed-script');

async function seedDatabase() {
  try {
    await AppDataSource.initialize();
    eventLogger("database_connected", { context: "seed_script" });

    // Create admin user
    const adminUser = new User();
    adminUser.username = "admin";
    adminUser.email = "admin@example.com";
    adminUser.password = await bcrypt.hash("admin123", 12);
    adminUser.role = UserRole.ADMIN;
    adminUser.firstName = "Admin";
    adminUser.lastName = "User";
    adminUser.isActive = true;

    await AppDataSource.getRepository(User).save(adminUser);
    eventLogger("admin_user_created", { email: adminUser.email, username: adminUser.username });

    // Create regular user
    const regularUser = new User();
    regularUser.username = "user";
    regularUser.email = "user@example.com";
    regularUser.password = await bcrypt.hash("user123", 12);
    regularUser.role = UserRole.USER;
    regularUser.firstName = "Regular";
    regularUser.lastName = "User";
    regularUser.isActive = true;

    await AppDataSource.getRepository(User).save(regularUser);
    eventLogger("regular_user_created", { email: regularUser.email, username: regularUser.username });

    // Create categories
    const categories = [
      {
        name: "Electronics",
        description: "Electronic devices and accessories",
        imageUrl: "https://example.com/electronics.jpg"
      },
      {
        name: "Clothing",
        description: "Fashion and apparel",
        imageUrl: "https://example.com/clothing.jpg"
      },
      {
        name: "Books",
        description: "Books and educational materials",
        imageUrl: "https://example.com/books.jpg"
      },
      {
        name: "Home & Garden",
        description: "Home improvement and garden supplies",
        imageUrl: "https://example.com/home.jpg"
      }
    ];

    const savedCategories = [];
    for (const categoryData of categories) {
      const category = new Category();
      Object.assign(category, categoryData);
      const savedCategory = await AppDataSource.getRepository(Category).save(category);
      savedCategories.push(savedCategory);
    }
    eventLogger("categories_created", { count: savedCategories.length, categories: savedCategories.map(c => c.name) });

    // Create products
    const products = [
      {
        name: "iPhone 15 Pro",
        description: "Latest iPhone with advanced features",
        price: 999.99,
        stockQuantity: 50,
        sku: "IPH15PRO",
        imageUrl: "https://example.com/iphone15.jpg",
        categoryId: savedCategories[0].id
      },
      {
        name: "Samsung Galaxy S24",
        description: "Premium Android smartphone",
        price: 899.99,
        stockQuantity: 30,
        sku: "SGS24",
        imageUrl: "https://example.com/galaxy-s24.jpg",
        categoryId: savedCategories[0].id
      },
      {
        name: "MacBook Pro 16-inch",
        description: "Powerful laptop for professionals",
        price: 2499.99,
        stockQuantity: 20,
        sku: "MBP16",
        imageUrl: "https://example.com/macbook-pro.jpg",
        categoryId: savedCategories[0].id
      },
      {
        name: "Nike Air Max 270",
        description: "Comfortable running shoes",
        price: 150.00,
        stockQuantity: 100,
        sku: "NAM270",
        imageUrl: "https://example.com/nike-airmax.jpg",
        categoryId: savedCategories[1].id
      },
      {
        name: "Levi's 501 Jeans",
        description: "Classic straight-fit jeans",
        price: 89.99,
        stockQuantity: 75,
        sku: "LEV501",
        imageUrl: "https://example.com/levis-501.jpg",
        categoryId: savedCategories[1].id
      },
      {
        name: "The Great Gatsby",
        description: "Classic American novel",
        price: 12.99,
        stockQuantity: 200,
        sku: "TGG001",
        imageUrl: "https://example.com/great-gatsby.jpg",
        categoryId: savedCategories[2].id
      },
      {
        name: "Coffee Maker",
        description: "Automatic drip coffee maker",
        price: 79.99,
        stockQuantity: 40,
        sku: "CM001",
        imageUrl: "https://example.com/coffee-maker.jpg",
        categoryId: savedCategories[3].id
      },
      {
        name: "Garden Hose",
        description: "50ft expandable garden hose",
        price: 29.99,
        stockQuantity: 60,
        sku: "GH050",
        imageUrl: "https://example.com/garden-hose.jpg",
        categoryId: savedCategories[3].id
      }
    ];

    for (const productData of products) {
      const product = new Product();
      Object.assign(product, productData);
      await AppDataSource.getRepository(Product).save(product);
    }
    eventLogger("products_created", { count: products.length, products: products.map(p => p.name) });

    eventLogger("database_seeded_successfully", { 
      users: 2, 
      categories: savedCategories.length, 
      products: products.length 
    });
  } catch (error) {
    errorLogger(error as Error, { context: "seed_database" });
  } finally {
    await AppDataSource.destroy();
  }
}

seedDatabase();
