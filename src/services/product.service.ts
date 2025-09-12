import { AppDataSource } from "../config/datasource";
import { Product } from "../entities/product.entity";
import { Repository, Like, Between } from "typeorm";

export interface ProductSearchFilters {
  search?: string;
  categoryId?: string;
  minPrice?: number;
  maxPrice?: number;
  isAvailable?: boolean;
  page?: number;
  limit?: number;
}

export interface ProductSearchResult {
  products: Product[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export class ProductService {
  private repo: Repository<Product>;

  constructor() {
    this.repo = AppDataSource.getRepository(Product);
  }

  async listAll(): Promise<Product[]> {
    return this.repo.find({
      relations: ['category'],
      where: { isAvailable: true }
    });
  }

  async findById(id: string) {
    return this.repo.findOne({
      where: { id },
      relations: ['category']
    });
  }

  async create(data: Partial<Product>) {
    const p = this.repo.create(data);
    return this.repo.save(p);
  }

  async update(id: string, data: Partial<Product>) {
    await this.repo.update({ id }, data);
    return this.findById(id);
  }

  async remove(id: string) {
    return this.repo.delete({ id });
  }

  async search(filters: ProductSearchFilters): Promise<ProductSearchResult> {
    const {
      search,
      categoryId,
      minPrice,
      maxPrice,
      isAvailable = true,
      page = 1,
      limit = 10
    } = filters;

    const queryBuilder = this.repo.createQueryBuilder('product')
      .leftJoinAndSelect('product.category', 'category')
      .where('product.isAvailable = :isAvailable', { isAvailable });

    // Search by name or description
    if (search) {
      queryBuilder.andWhere(
        '(product.name ILIKE :search OR product.description ILIKE :search)',
        { search: `%${search}%` }
      );
    }

    // Filter by category
    if (categoryId) {
      queryBuilder.andWhere('product.categoryId = :categoryId', { categoryId });
    }

    // Filter by price range
    if (minPrice !== undefined) {
      queryBuilder.andWhere('product.price >= :minPrice', { minPrice });
    }
    if (maxPrice !== undefined) {
      queryBuilder.andWhere('product.price <= :maxPrice', { maxPrice });
    }

    // Get total count
    const total = await queryBuilder.getCount();

    // Apply pagination
    const offset = (page - 1) * limit;
    const products = await queryBuilder
      .orderBy('product.createdAt', 'DESC')
      .skip(offset)
      .take(limit)
      .getMany();

    const totalPages = Math.ceil(total / limit);

    return {
      products,
      total,
      page,
      limit,
      totalPages
    };
  }

  async getProductsByCategory(categoryId: string): Promise<Product[]> {
    return this.repo.find({
      where: { categoryId, isAvailable: true },
      relations: ['category']
    });
  }

  async getFeaturedProducts(limit: number = 8): Promise<Product[]> {
    return this.repo.find({
      where: { isAvailable: true },
      relations: ['category'],
      order: { createdAt: 'DESC' },
      take: limit
    });
  }
}
