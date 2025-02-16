import { IsNumber, IsString } from "class-validator";

export class StreetNosheryMenuUpdateDto {
    @IsNumber()
    shopId: number;

    @IsString()
    dishName: string;

    @IsString()
    description: string;

    @IsString()
    price: string;

    @IsNumber()
    rating: number;
}