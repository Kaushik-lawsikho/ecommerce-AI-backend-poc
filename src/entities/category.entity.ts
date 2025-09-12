import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from "typeorm";
import { Product } from "./product.entity";

@Entity()
export class Category {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ length: 100, unique: true })
  name!: string;

  @Column({ length: 500, nullable: true })
  description?: string;

  @Column({ length: 255, nullable: true })
  imageUrl?: string;

  @Column({ default: true })
  isActive!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @OneToMany(() => Product, product => product.category)
  products!: Product[];
}
