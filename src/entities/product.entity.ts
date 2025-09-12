import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany } from "typeorm";
import { Category } from "./category.entity";
import { OrderItem } from "./order-item.entity";

@Entity()
export class Product {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ length: 255 })
  name!: string;

  @Column("text", { nullable: true })
  description?: string;

  @Column("decimal", { precision: 10, scale: 2 })
  price!: number;

  @Column({ default: true })
  isAvailable!: boolean;

  @Column({ nullable: true })
  imageUrl?: string;

  @Column({ default: 0 })
  stockQuantity!: number;

  @Column({ length: 50, nullable: true })
  sku?: string;

  @ManyToOne(() => Category, category => category.products)
  @JoinColumn({ name: "categoryId" })
  category?: Category;

  @Column({ nullable: true })
  categoryId?: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @OneToMany(() => OrderItem, orderItem => orderItem.product)
  orderItems!: OrderItem[];
}
