import { Module } from "@nestjs/common";
import { StreetNosheryMenuModelHelperService } from "./menu-modelhelper.service";
import { DatabaseProvider } from "src/database/database-provider.module";

@Module({
    exports: [StreetNosheryMenuModelHelperService],
    providers: [StreetNosheryMenuModelHelperService],
    imports: [DatabaseProvider]
})

export class StreetNosheryMenuModelHelperModule{}