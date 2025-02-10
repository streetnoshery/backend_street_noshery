import { Module } from "@nestjs/common";
import { StreetNosheryCustomerService } from "./customer.service";
import { StreetNosheryCustomerController } from "./customer.controller";
import { StreetNosheryCustomerModelhelperModule } from "./model/customer-modelhelper.module";

@Module({
    exports: [StreetNosheryCustomerService],
    providers: [StreetNosheryCustomerService],
    controllers: [StreetNosheryCustomerController],
    imports: [StreetNosheryCustomerModelhelperModule]
})

export class StreetNosheryCustomerModule {}