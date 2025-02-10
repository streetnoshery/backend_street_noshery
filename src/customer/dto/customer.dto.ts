import { IsNumberString, IsString, Length } from "class-validator";

export class StreetNosheryCreateCustomer {
    @IsString()
    @IsNumberString()
    @Length(10)
    mobileNumber: string;

    @IsString()
    countryCode: string;
}