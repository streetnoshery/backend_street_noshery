import { Module } from "@nestjs/common";
import { StreetNosheryCustomerModelHelper } from "./customer-modelhelper.service";
import { DatabaseProvider } from "src/database/database-provider.module";

@Module({
    providers: [StreetNosheryCustomerModelHelper],
    exports: [StreetNosheryCustomerModelHelper],
    imports: [DatabaseProvider]
})

export class StreetNosheryCustomerModelhelperModule{}