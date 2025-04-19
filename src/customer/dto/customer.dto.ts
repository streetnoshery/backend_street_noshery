import { IsBoolean, IsEmail, IsNotEmpty, IsNumber, IsNumberString, IsOptional, IsString, Length, Matches, ValidateNested } from "class-validator";
import { Type } from "class-transformer";

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

    @IsString()
    @IsOptional()
    firstLine: string;

    @IsString()
    @IsOptional()
    secondLine: string;

    @IsOptional()
    @IsString()
    shopId: string;
}

export class StreetNosheryEnableNotification {
    @IsString()
    customerId: string

    @IsBoolean()
    isEnable: boolean
}

export class UpdateAddressDto {
    @IsString()
    firstLine: string;

    @IsString()
    @IsOptional()
    secondLine: string;

    @IsNumber()
    shopId: number;

    @IsString()
    customerId: string;
}

export class UpdateCustomerDetailsDto {
    @IsString()
    customerId: string;


    @IsNotEmpty()
    @IsString()
    @Length(10, 15)
    @IsOptional()
    mobileNumber: string;

    @IsNotEmpty()
    @IsString()
    @Matches(/^\+\d{1,3}$/) // Ensures country code format like +91
    @IsOptional()
    countryCode: string;

    @IsNotEmpty()
    @IsEmail()
    @IsOptional()
    email: string;

    @IsNotEmpty()
    @IsString()
    @Matches(/^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,}$/)
    @IsOptional()
    password: string; // At least 6 chars, 1 uppercase, 1 number, 1 special char

    @IsNotEmpty()
    @IsString()
    @IsOptional()
    userName: string;
}