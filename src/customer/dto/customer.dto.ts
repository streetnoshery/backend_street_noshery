import { IsBoolean, IsNumber, IsNumberString, IsOptional, IsString, Length, ValidateNested } from "class-validator";
import { Type } from "class-transformer";

class Address {
    @IsString()
    firstLine: string;

    @IsString()
    @IsOptional()
    secondLine: string;

    @IsNumber()
    shopId: number;
}
export class StreetNosheryCreateCustomer {
    @IsNumberString()
    @Length(10, 10)
    mobileNumber: string;

    @IsString()
    @IsOptional()
    countryCode: string;

    @IsString()
    @IsOptional()
    email: string;

    @IsString()
    @IsOptional()
    password: string; // Fixed naming (camelCase)

    @IsString()
    @IsOptional()
    userName: string;

    @ValidateNested()
    @Type(() => Address)
    @IsOptional()
    address: Address; // Fixed naming (camelCase)
}

export class StreetNosheryEnableNotification {
    @IsString()
    customerId: string

    @IsBoolean()
    isEnable: boolean
}