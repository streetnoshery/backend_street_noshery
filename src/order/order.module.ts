import { Module } from "@nestjs/common";
import { StreetnosheryOrderService } from "./order.service";
import { StreetNosheryOrderController } from "./order.controller";
import { StreetNosheryOrderModelHelperModule } from "./model/order.module";

@Module({
    controllers: [StreetNosheryOrderController],
    providers: [StreetnosheryOrderService],
    exports: [StreetnosheryOrderService],
    imports: [StreetNosheryOrderModelHelperModule]
})

export class StreetNosheryOrderModule {}