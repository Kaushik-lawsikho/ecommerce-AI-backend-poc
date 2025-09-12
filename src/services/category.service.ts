import { Repository } from "typeorm";
import { AppDataSource } from "../config/datasource";
import { Category } from "../entities/category.entity";

export class CategoryService {
  private repo: Repository<Category>;

  constructor() {
    this.repo = AppDataSource.getRepository(Category);
  }

  async listAll(): Promise<Category[]> {
    return this.repo.find({ where: { isActive: true } });
  }

  async findById(id: string): Promise<Category | null> {
    return this.repo.findOne({ where: { id } });
  }

  async create(data: Partial<Category>): Promise<Category> {
    const category = this.repo.create(data);
    return this.repo.save(category);
  }

  async update(id: string, data: Partial<Category>): Promise<Category | null> {
    await this.repo.update({ id }, data);
    return this.findById(id);
  }

  async remove(id: string): Promise<void> {
    // Soft delete by setting isActive to false
    await this.repo.update({ id }, { isActive: false });
  }

  async getCategoryWithProducts(id: string): Promise<Category | null> {
    return this.repo.findOne({
      where: { id },
      relations: ['products']
    });
  }
}
