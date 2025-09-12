import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from "typeorm";
import { Order } from "./order.entity";
import { Product } from "./product.entity";

@Entity()
export class OrderItem {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @ManyToOne(() => Order, order => order.items, { onDelete: "CASCADE" })
  @JoinColumn({ name: "orderId" })
  order!: Order;

  @Column()
  orderId!: string;

  @ManyToOne(() => Product)
  @JoinColumn({ name: "productId" })
  product!: Product;

  @Column()
  productId!: string;

  @Column()
  quantity!: number;

  @Column("decimal", { precision: 10, scale: 2 })
  unitPrice!: number;

  @Column("decimal", { precision: 10, scale: 2 })
  totalPrice!: number;
}
