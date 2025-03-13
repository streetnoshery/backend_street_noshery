import { IsString, IsNumber } from "class-validator";

export class ReviewsDto {
    @IsString()
    customerId: string;

    @IsNumber()
    stars: number;

    @IsNumber()
    shopId: number;

    @IsString()
    reviews: string
}
