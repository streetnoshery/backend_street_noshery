import { Type } from "class-transformer";
import { IsString, IsNumber, IsOptional, IsArray } from "class-validator";

export class ReviewsDto {
    @IsString()
    @IsOptional()
    customerId: string;

    @IsNumber()
    stars: number;

    @IsNumber()
    shopId: number;

    @IsString()
    @IsOptional()
    reviews: string

    @IsOptional()
    @IsArray()
    @IsNumber({}, { each: true })
    @Type(() => Number)
    foodId: number[];
}

