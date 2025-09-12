import { ProductService } from "./product.service";

export interface CartItem {
  productId: string;
  quantity: number;
  product?: any; // Product details
}

export interface Cart {
  userId: string;
  items: CartItem[];
  totalAmount: number;
  totalItems: number;
}

// In-memory cart storage (in production, use Redis or database)
const carts = new Map<string, Cart>();

export class CartService {
  private productService: ProductService;

  constructor() {
    this.productService = new ProductService();
  }

  async getCart(userId: string): Promise<Cart> {
    let cart = carts.get(userId);
    
    if (!cart) {
      cart = {
        userId,
        items: [],
        totalAmount: 0,
        totalItems: 0
      };
      carts.set(userId, cart);
    }

    // Populate product details
    await this.populateProductDetails(cart);
    return cart;
  }

  async addToCart(userId: string, productId: string, quantity: number = 1): Promise<Cart> {
    const product = await this.productService.findById(productId);
    
    if (!product) {
      throw new Error("Product not found");
    }

    if (!product.isAvailable) {
      throw new Error("Product is not available");
    }

    if (product.stockQuantity < quantity) {
      throw new Error(`Insufficient stock. Available: ${product.stockQuantity}`);
    }

    let cart = await this.getCart(userId);
    
    // Check if product already exists in cart
    const existingItemIndex = cart.items.findIndex(item => item.productId === productId);
    
    if (existingItemIndex >= 0) {
      // Update quantity
      cart.items[existingItemIndex].quantity += quantity;
    } else {
      // Add new item
      cart.items.push({
        productId,
        quantity,
        product: {
          id: product.id,
          name: product.name,
          price: product.price,
          imageUrl: product.imageUrl
        }
      });
    }

    await this.calculateTotals(cart);
    carts.set(userId, cart);
    
    return cart;
  }

  async updateCartItem(userId: string, productId: string, quantity: number): Promise<Cart> {
    const cart = await this.getCart(userId);
    const itemIndex = cart.items.findIndex(item => item.productId === productId);
    
    if (itemIndex === -1) {
      throw new Error("Item not found in cart");
    }

    if (quantity <= 0) {
      // Remove item
      cart.items.splice(itemIndex, 1);
    } else {
      // Update quantity
      const product = await this.productService.findById(productId);
      if (product && product.stockQuantity < quantity) {
        throw new Error(`Insufficient stock. Available: ${product.stockQuantity}`);
      }
      cart.items[itemIndex].quantity = quantity;
    }

    await this.calculateTotals(cart);
    carts.set(userId, cart);
    
    return cart;
  }

  async removeFromCart(userId: string, productId: string): Promise<Cart> {
    const cart = await this.getCart(userId);
    const itemIndex = cart.items.findIndex(item => item.productId === productId);
    
    if (itemIndex === -1) {
      throw new Error("Item not found in cart");
    }

    cart.items.splice(itemIndex, 1);
    await this.calculateTotals(cart);
    carts.set(userId, cart);
    
    return cart;
  }

  async clearCart(userId: string): Promise<Cart> {
    const cart: Cart = {
      userId,
      items: [],
      totalAmount: 0,
      totalItems: 0
    };
    carts.set(userId, cart);
    return cart;
  }

  private async populateProductDetails(cart: Cart): Promise<void> {
    for (const item of cart.items) {
      if (!item.product) {
        const product = await this.productService.findById(item.productId);
        if (product) {
          item.product = {
            id: product.id,
            name: product.name,
            price: product.price,
            imageUrl: product.imageUrl
          };
        }
      }
    }
  }

  private async calculateTotals(cart: Cart): Promise<void> {
    cart.totalItems = cart.items.reduce((sum, item) => sum + item.quantity, 0);
    cart.totalAmount = cart.items.reduce((sum, item) => {
      return sum + (item.product?.price || 0) * item.quantity;
    }, 0);
  }
}
