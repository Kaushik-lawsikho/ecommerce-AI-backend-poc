import { IsString, IsEmail, IsOptional, IsNumber, IsBoolean, IsEnum, IsUUID, MinLength, MaxLength, Min, IsPositive, Matches, IsUrl, IsNotEmpty, IsInt, IsArray, ValidateNested, IsObject } from "class-validator";
import { Transform, Type, plainToClass } from "class-transformer";
import { UserRole } from "../entities/user.entity";

/**
 * Base validation DTO with common security constraints
 */
export abstract class BaseValidationDto {
  @IsOptional()
  @IsString()
  @MaxLength(1000, { message: "Field exceeds maximum length" })
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  sanitizedField?: string;
}

/**
 * User Registration DTO with comprehensive validation
 */
export class RegisterDto extends BaseValidationDto {
  @IsNotEmpty({ message: "Username is required" })
  @IsString({ message: "Username must be a string" })
  @MinLength(3, { message: "Username must be at least 3 characters long" })
  @MaxLength(50, { message: "Username must not exceed 50 characters" })
  @Matches(/^[a-zA-Z0-9_-]+$/, { message: "Username can only contain letters, numbers, underscores, and hyphens" })
  username: string = '';

  @IsNotEmpty({ message: "Email is required" })
  @IsEmail({}, { message: "Email must be a valid email address" })
  @MaxLength(255, { message: "Email must not exceed 255 characters" })
  email: string = '';

  @IsNotEmpty({ message: "Password is required" })
  @IsString({ message: "Password must be a string" })
  @MinLength(8, { message: "Password must be at least 8 characters long" })
  @MaxLength(128, { message: "Password must not exceed 128 characters" })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/, {
    message: "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"
  })
  password: string = '';

  @IsOptional()
  @IsString({ message: "First name must be a string" })
  @MaxLength(100, { message: "First name must not exceed 100 characters" })
  @Matches(/^[a-zA-Z\s'-]+$/, { message: "First name can only contain letters, spaces, hyphens, and apostrophes" })
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  firstName?: string;

  @IsOptional()
  @IsString({ message: "Last name must be a string" })
  @MaxLength(100, { message: "Last name must not exceed 100 characters" })
  @Matches(/^[a-zA-Z\s'-]+$/, { message: "Last name can only contain letters, spaces, hyphens, and apostrophes" })
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  lastName?: string;

  @IsOptional()
  @IsString({ message: "Phone must be a string" })
  @MaxLength(20, { message: "Phone must not exceed 20 characters" })
  @Matches(/^[\+]?[1-9][\d]{0,15}$/, { message: "Phone must be a valid phone number" })
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  phone?: string;

  @IsOptional()
  @IsEnum(UserRole, { message: "Role must be either 'admin' or 'user'" })
  role?: UserRole;
}

/**
 * User Login DTO
 */
export class LoginDto extends BaseValidationDto {
  @IsNotEmpty({ message: "Username or email is required" })
  @IsString({ message: "Username or email must be a string" })
  @MaxLength(255, { message: "Username or email must not exceed 255 characters" })
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  usernameOrEmail!: string;

  @IsNotEmpty({ message: "Password is required" })
  @IsString({ message: "Password must be a string" })
  @MaxLength(128, { message: "Password must not exceed 128 characters" })
  password!: string;
}

/**
 * Product Creation DTO
 */
export class CreateProductDto extends BaseValidationDto {
  @IsNotEmpty({ message: "Product name is required" })
  @IsString({ message: "Product name must be a string" })
  @MinLength(1, { message: "Product name cannot be empty" })
  @MaxLength(255, { message: "Product name must not exceed 255 characters" })
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  name!: string;

  @IsOptional()
  @IsString({ message: "Description must be a string" })
  @MaxLength(2000, { message: "Description must not exceed 2000 characters" })
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  description?: string;

  @IsNotEmpty({ message: "Price is required" })
  @IsNumber({ maxDecimalPlaces: 2 }, { message: "Price must be a valid number with max 2 decimal places" })
  @IsPositive({ message: "Price must be a positive number" })
  @Min(0.01, { message: "Price must be at least 0.01" })
  @Transform(({ value }) => typeof value === 'string' ? parseFloat(value) : value)
  price!: number;

  @IsOptional()
  @IsBoolean({ message: "isAvailable must be a boolean" })
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.toLowerCase() === 'true';
    }
    return value;
  })
  isAvailable?: boolean;

  @IsOptional()
  @IsUrl({}, { message: "Image URL must be a valid URL" })
  @MaxLength(500, { message: "Image URL must not exceed 500 characters" })
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  imageUrl?: string;

  @IsOptional()
  @IsUUID(4, { message: "Category ID must be a valid UUID" })
  categoryId?: string;
}

/**
 * Product Update DTO
 */
export class UpdateProductDto extends BaseValidationDto {
  @IsOptional()
  @IsString({ message: "Product name must be a string" })
  @MinLength(1, { message: "Product name cannot be empty" })
  @MaxLength(255, { message: "Product name must not exceed 255 characters" })
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  name?: string;

  @IsOptional()
  @IsString({ message: "Description must be a string" })
  @MaxLength(2000, { message: "Description must not exceed 2000 characters" })
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  description?: string;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 }, { message: "Price must be a valid number with max 2 decimal places" })
  @IsPositive({ message: "Price must be a positive number" })
  @Min(0.01, { message: "Price must be at least 0.01" })
  @Transform(({ value }) => typeof value === 'string' ? parseFloat(value) : value)
  price?: number;

  @IsOptional()
  @IsBoolean({ message: "isAvailable must be a boolean" })
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.toLowerCase() === 'true';
    }
    return value;
  })
  isAvailable?: boolean;

  @IsOptional()
  @IsUrl({}, { message: "Image URL must be a valid URL" })
  @MaxLength(500, { message: "Image URL must not exceed 500 characters" })
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  imageUrl?: string;

  @IsOptional()
  @IsUUID(4, { message: "Category ID must be a valid UUID" })
  categoryId?: string;
}

/**
 * Category Creation DTO
 */
export class CreateCategoryDto extends BaseValidationDto {
  @IsNotEmpty({ message: "Category name is required" })
  @IsString({ message: "Category name must be a string" })
  @MinLength(1, { message: "Category name cannot be empty" })
  @MaxLength(100, { message: "Category name must not exceed 100 characters" })
  @Matches(/^[a-zA-Z0-9\s&-]+$/, { message: "Category name can only contain letters, numbers, spaces, hyphens, and ampersands" })
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  name!: string;

  @IsOptional()
  @IsString({ message: "Description must be a string" })
  @MaxLength(500, { message: "Description must not exceed 500 characters" })
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  description?: string;
}

/**
 * Search and Filter DTO
 */
export class SearchProductsDto extends BaseValidationDto {
  @IsOptional()
  @IsString({ message: "Search term must be a string" })
  @MaxLength(100, { message: "Search term must not exceed 100 characters" })
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  search?: string;

  @IsOptional()
  @IsUUID(4, { message: "Category ID must be a valid UUID" })
  categoryId?: string;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 }, { message: "Min price must be a valid number" })
  @IsPositive({ message: "Min price must be positive" })
  @Transform(({ value }) => typeof value === 'string' ? parseFloat(value) : value)
  minPrice?: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 }, { message: "Max price must be a valid number" })
  @IsPositive({ message: "Max price must be positive" })
  @Transform(({ value }) => typeof value === 'string' ? parseFloat(value) : value)
  maxPrice?: number;

  @IsOptional()
  @IsInt({ message: "Page must be an integer" })
  @Min(1, { message: "Page must be at least 1" })
  @Transform(({ value }) => typeof value === 'string' ? parseInt(value) : value)
  page?: number;

  @IsOptional()
  @IsInt({ message: "Limit must be an integer" })
  @Min(1, { message: "Limit must be at least 1" })
  @Transform(({ value }) => typeof value === 'string' ? parseInt(value) : value)
  limit?: number;
}

/**
 * File Upload DTO
 */
export class FileUploadDto extends BaseValidationDto {
  @IsNotEmpty({ message: "File is required" })
  @IsString({ message: "File must be provided" })
  file!: string; // Base64 encoded file

  @IsOptional()
  @IsString({ message: "File name must be a string" })
  @MaxLength(255, { message: "File name must not exceed 255 characters" })
  @Matches(/^[a-zA-Z0-9._-]+$/, { message: "File name contains invalid characters" })
  fileName?: string;

  @IsOptional()
  @IsString({ message: "File type must be a string" })
  @MaxLength(50, { message: "File type must not exceed 50 characters" })
  fileType?: string;
}

/**
 * Order Creation DTO
 */
export class CreateOrderDto extends BaseValidationDto {
  @IsNotEmpty({ message: "Order items are required" })
  @IsArray({ message: "Order items must be an array" })
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items!: OrderItemDto[];

  @IsOptional()
  @IsString({ message: "Shipping address must be a string" })
  @MaxLength(500, { message: "Shipping address must not exceed 500 characters" })
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  shippingAddress?: string;

  @IsOptional()
  @IsString({ message: "Notes must be a string" })
  @MaxLength(1000, { message: "Notes must not exceed 1000 characters" })
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  notes?: string;
}

/**
 * Order Item DTO
 */
export class OrderItemDto extends BaseValidationDto {
  @IsNotEmpty({ message: "Product ID is required" })
  @IsUUID(4, { message: "Product ID must be a valid UUID" })
  productId!: string;

  @IsNotEmpty({ message: "Quantity is required" })
  @IsInt({ message: "Quantity must be an integer" })
  @Min(1, { message: "Quantity must be at least 1" })
  @Transform(({ value }) => typeof value === 'string' ? parseInt(value) : value)
  quantity!: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 }, { message: "Price must be a valid number" })
  @IsPositive({ message: "Price must be positive" })
  @Transform(({ value }) => typeof value === 'string' ? parseFloat(value) : value)
  price?: number;
}
