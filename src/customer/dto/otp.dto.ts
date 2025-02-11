import { IsEnum, IsNumberString, IsOptional, IsString, Length, MaxLength, MinLength } from "class-validator";
import { OtpGenerationReasons } from "../enums/customer.enums";

export class StreetNosheryGenerateOtp {
    @IsString()
    @IsNumberString()
    @Length(10)
    mobileNumber: string;

    @IsEnum(OtpGenerationReasons)
    reason: OtpGenerationReasons;

    @IsString()
    @Length(6)
    @MinLength(6)
    @MaxLength(6)
    @IsOptional()
    otp: string
}