import { Module } from "@nestjs/common";
import { StreetNosheryCustomerService } from "./customer.service";
import { StreetNosheryCustomerController } from "./customer.controller";

@Module({
    exports: [StreetNosheryCustomerService],
    providers: [StreetNosheryCustomerService],
    controllers: [StreetNosheryCustomerController]
})

export class StreetNosheryCustomerModule {}