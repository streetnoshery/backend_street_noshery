import { Module } from "@nestjs/common";
import { databaseProvider } from "./database-provider.service";

@Module({
    providers: [...databaseProvider],
    exports: [...databaseProvider]
})
export class DatabaseProvider {}