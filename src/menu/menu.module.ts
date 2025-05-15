import { Module } from "@nestjs/common";
import { StreetNosherymenuService } from "./menu.service";
import { StreetNosheryMenuController } from "./menu.controller";
import { StreetNosheryMenuModelHelperModule } from "./model/menu.module";
import { LoggerModule } from "src/logger/logger.module";

@Module({
    providers: [StreetNosherymenuService],
    exports: [StreetNosherymenuService],
    controllers: [StreetNosheryMenuController],
    imports: [StreetNosheryMenuModelHelperModule, LoggerModule]
})

export class StreetNosheryMenuModule{}