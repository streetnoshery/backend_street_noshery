import { Module } from "@nestjs/common";
import { StreetNosheryEmailModelHelperService } from "./email.model-helper.service";
import { DatabaseProvider } from "src/database/database-provider.module";

@Module({
    imports: [DatabaseProvider],
    controllers: [],
    providers: [StreetNosheryEmailModelHelperService],
    exports: [StreetNosheryEmailModelHelperService]
})

export class StreetNosheryEmailModelModule {}