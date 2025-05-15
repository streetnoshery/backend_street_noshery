import { Module } from "@nestjs/common";
import { StreetnosheryOrderService } from "./order.service";
import { StreetNosheryOrderController } from "./order.controller";
import { StreetNosheryOrderModelHelperModule } from "./model/order.module";
import { LoggerModule } from "src/logger/logger.module";

@Module({
    controllers: [StreetNosheryOrderController],
    providers: [StreetnosheryOrderService],
    exports: [StreetnosheryOrderService],
    imports: [StreetNosheryOrderModelHelperModule, LoggerModule]
})

export class StreetNosheryOrderModule {}