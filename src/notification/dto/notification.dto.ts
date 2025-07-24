import { IsArray, IsMobilePhone } from "class-validator";

export class MobileNumbersDto {
    @IsArray()
    mobileNumbers: string[];
  }

export class MailDto {
  @IsArray()
  emails: string[];
}