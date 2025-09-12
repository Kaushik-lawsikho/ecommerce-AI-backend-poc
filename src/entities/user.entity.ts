import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from "typeorm";
import { Order } from "./order.entity";

export enum UserRole {
  ADMIN = "admin",
  USER = "user"
}

@Entity()
export class User {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ unique: true, length: 100 })
  username!: string;

  @Column({ unique: true, length: 255 })
  email!: string;

  @Column({ length: 255 })
  password!: string; // This will store hashed password

  @Column({
    type: "enum",
    enum: UserRole,
    default: UserRole.USER
  })
  role!: UserRole;

  @Column({ length: 100, nullable: true })
  firstName?: string;

  @Column({ length: 100, nullable: true })
  lastName?: string;

  @Column({ length: 20, nullable: true })
  phone?: string;

  @Column({ default: true })
  isActive!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @OneToMany(() => Order, order => order.user)
  orders!: Order[];
}
