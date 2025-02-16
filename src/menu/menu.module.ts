import { Module } from "@nestjs/common";
import { StreetNosherymenuService } from "./menu.service";
import { StreetNosheryMenuController } from "./menu.controller";
import { StreetNosheryMenuModelHelperModule } from "./model/menu.module";

@Module({
    providers: [StreetNosherymenuService],
    exports: [StreetNosherymenuService],
    controllers: [StreetNosheryMenuController],
    imports: [StreetNosheryMenuModelHelperModule]
})

export class StreetNosheryMenuModule{}