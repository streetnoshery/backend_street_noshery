import { Module } from "@nestjs/common";
import { DatabaseProvider } from "src/database/database-provider.module";
import { StreetNosheryOrderModelHelperService } from "./order-modelhelper.service";

@Module({
    exports: [StreetNosheryOrderModelHelperService],
    providers: [StreetNosheryOrderModelHelperService],
    imports: [DatabaseProvider]
})

export class StreetNosheryOrderModelHelperModule{}