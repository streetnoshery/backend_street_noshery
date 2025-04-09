import { IsString, IsNumber, IsArray, ValidateNested, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { CustomerOrderStatus } from '../enums/order.enum';

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

export class CustomerOrderFTDto {
    @IsString()
    customerId: string;

    @IsNumber()
    shopId: number;

    @IsString()
    paymentId: string;

    @IsString()
    razorpayOrderId: string;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => OrderItemDto)
    orderItems: OrderItemDto[];
}

export class CustomerOrderDto {
    @IsString()
    orderTrackId: string;

    @IsString()
    customerId: string;

    @IsNumber()
    shopId: number;
}

export class UpdateOrderDto {
    @IsString()
    orderTrackId: string;

    @IsString()
    customerId: string;

    @IsNumber()
    shopId: number;

    @IsEnum(CustomerOrderStatus)
    orderStatus: CustomerOrderStatus;
}
