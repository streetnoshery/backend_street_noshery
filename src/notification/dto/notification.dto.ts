import { IsArray, IsEmail, IsMobilePhone, IsString, Matches, ValidateNested } from "class-validator";
import { Type } from 'class-transformer';
export class MobileNumbersDto {
  @IsArray()
  mobileNumbers: string[];
}

export class EmailMobileEntryDto {
  @IsString()
  @Matches(/^\d{10}$/, { message: 'Mobile number must be 10 digits' })
  mobile: string;

  @IsEmail({}, { message: 'Invalid email address' })
  email: string;
}
export class MailDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EmailMobileEntryDto)
  emails: EmailMobileEntryDto[];
}