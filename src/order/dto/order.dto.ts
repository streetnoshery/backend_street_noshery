import { IsString, IsNumber, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class OrderItemDto {
    @IsString()
    dishName: string;

    @IsString()
    description: string;

    @IsString()
    price: string;

    @IsNumber()
    rating: number;

    @IsNumber()
    foodId: number;
}

export class CustomerOrderDto {
    @IsString()
    customerId: string;

    @IsString()
    shopId: string;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => OrderItemDto)
    orderItems: OrderItemDto[];
}
