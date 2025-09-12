import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn } from "typeorm";
import { User } from "./user.entity";
import { OrderItem } from "./order-item.entity";

export enum OrderStatus {
  PENDING = "pending",
  CONFIRMED = "confirmed",
  SHIPPED = "shipped",
  DELIVERED = "delivered",
  CANCELLED = "cancelled"
}

@Entity()
export class Order {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ length: 50, unique: true })
  orderNumber!: string;

  @ManyToOne(() => User, user => user.orders)
  @JoinColumn({ name: "userId" })
  user!: User;

  @Column()
  userId!: string;

  @Column({
    type: "enum",
    enum: OrderStatus,
    default: OrderStatus.PENDING
  })
  status!: OrderStatus;

  @Column("decimal", { precision: 10, scale: 2 })
  totalAmount!: number;

  @Column("decimal", { precision: 10, scale: 2, default: 0 })
  shippingCost!: number;

  @Column("decimal", { precision: 10, scale: 2, default: 0 })
  taxAmount!: number;

  @Column({ length: 255, nullable: true })
  shippingAddress?: string;

  @Column({ length: 100, nullable: true })
  shippingCity?: string;

  @Column({ length: 20, nullable: true })
  shippingPostalCode?: string;

  @Column({ length: 100, nullable: true })
  shippingCountry?: string;

  @Column({ length: 500, nullable: true })
  notes?: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @OneToMany(() => OrderItem, orderItem => orderItem.order, { cascade: true })
  items!: OrderItem[];
}
