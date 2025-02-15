import { IsString } from "class-validator";

export class StreetNosheryFirebaseDto {
    data: any;

    @IsString()
    collection: string;

    @IsString()
    document: string;
}