import { Repository } from "typeorm";
import { AppDataSource } from "../config/datasource";
import { Order, OrderStatus } from "../entities/order.entity";
import { OrderItem } from "../entities/order-item.entity";
import { Product } from "../entities/product.entity";

export interface CreateOrderRequest {
  items: {
    productId: string;
    quantity: number;
  }[];
  shippingAddress?: string;
  shippingCity?: string;
  shippingPostalCode?: string;
  shippingCountry?: string;
  notes?: string;
}

export class OrderService {
  private orderRepo: Repository<Order>;
  private orderItemRepo: Repository<OrderItem>;
  private productRepo: Repository<Product>;

  constructor() {
    this.orderRepo = AppDataSource.getRepository(Order);
    this.orderItemRepo = AppDataSource.getRepository(OrderItem);
    this.productRepo = AppDataSource.getRepository(Product);
  }

  async createOrder(userId: string, orderData: CreateOrderRequest): Promise<Order> {
    // Generate order number
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Calculate totals
    let totalAmount = 0;
    const orderItems: Partial<OrderItem>[] = [];

    // Validate products and calculate totals
    for (const item of orderData.items) {
      const product = await this.productRepo.findOne({ where: { id: item.productId } });
      
      if (!product) {
        throw new Error(`Product with ID ${item.productId} not found`);
      }

      if (!product.isAvailable) {
        throw new Error(`Product ${product.name} is not available`);
      }

      if (product.stockQuantity < item.quantity) {
        throw new Error(`Insufficient stock for product ${product.name}. Available: ${product.stockQuantity}`);
      }

      const itemTotal = product.price * item.quantity;
      totalAmount += itemTotal;

      orderItems.push({
        productId: product.id,
        quantity: item.quantity,
        unitPrice: product.price,
        totalPrice: itemTotal
      });
    }

    // Create order
    const order = this.orderRepo.create({
      orderNumber,
      userId,
      totalAmount,
      shippingAddress: orderData.shippingAddress,
      shippingCity: orderData.shippingCity,
      shippingPostalCode: orderData.shippingPostalCode,
      shippingCountry: orderData.shippingCountry,
      notes: orderData.notes,
      status: OrderStatus.PENDING
    });

    const savedOrder = await this.orderRepo.save(order);

    // Create order items
    const orderItemsWithOrderId = orderItems.map(item => ({
      ...item,
      orderId: savedOrder.id
    }));

    await this.orderItemRepo.save(orderItemsWithOrderId);

    // Update product stock
    for (const item of orderData.items) {
      await this.productRepo.decrement({ id: item.productId }, 'stockQuantity', item.quantity);
    }

    // Return order with items
    const createdOrder = await this.getOrderById(savedOrder.id);
    if (!createdOrder) {
      throw new Error('Failed to retrieve created order');
    }
    return createdOrder;
  }

  async getOrderById(orderId: string): Promise<Order | null> {
    return this.orderRepo.findOne({
      where: { id: orderId },
      relations: ['items', 'items.product', 'user']
    });
  }

  async getUserOrders(userId: string, page: number = 1, limit: number = 10): Promise<{ orders: Order[]; total: number; page: number; limit: number; totalPages: number }> {
    const queryBuilder = this.orderRepo.createQueryBuilder('order')
      .leftJoinAndSelect('order.items', 'items')
      .leftJoinAndSelect('items.product', 'product')
      .where('order.userId = :userId', { userId })
      .orderBy('order.createdAt', 'DESC');

    const total = await queryBuilder.getCount();
    const offset = (page - 1) * limit;
    
    const orders = await queryBuilder
      .skip(offset)
      .take(limit)
      .getMany();

    const totalPages = Math.ceil(total / limit);

    return {
      orders,
      total,
      page,
      limit,
      totalPages
    };
  }

  async getAllOrders(page: number = 1, limit: number = 10): Promise<{ orders: Order[]; total: number; page: number; limit: number; totalPages: number }> {
    const queryBuilder = this.orderRepo.createQueryBuilder('order')
      .leftJoinAndSelect('order.items', 'items')
      .leftJoinAndSelect('items.product', 'product')
      .leftJoinAndSelect('order.user', 'user')
      .orderBy('order.createdAt', 'DESC');

    const total = await queryBuilder.getCount();
    const offset = (page - 1) * limit;
    
    const orders = await queryBuilder
      .skip(offset)
      .take(limit)
      .getMany();

    const totalPages = Math.ceil(total / limit);

    return {
      orders,
      total,
      page,
      limit,
      totalPages
    };
  }

  async updateOrderStatus(orderId: string, status: OrderStatus): Promise<Order | null> {
    await this.orderRepo.update({ id: orderId }, { status });
    return this.getOrderById(orderId);
  }

  async cancelOrder(orderId: string): Promise<Order | null> {
    const order = await this.getOrderById(orderId);
    
    if (!order) {
      throw new Error('Order not found');
    }

    if (order.status === OrderStatus.CANCELLED) {
      throw new Error('Order is already cancelled');
    }

    if (order.status === OrderStatus.DELIVERED) {
      throw new Error('Cannot cancel delivered order');
    }

    // Restore product stock
    for (const item of order.items) {
      await this.productRepo.increment({ id: item.productId }, 'stockQuantity', item.quantity);
    }

    return this.updateOrderStatus(orderId, OrderStatus.CANCELLED);
  }
}
