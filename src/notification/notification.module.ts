import { Module } from "@nestjs/common";
import { NotificationController } from "./notification.controller";
import { NotificationService } from "./notification.service";
import { HttpModule } from '@nestjs/axios';
import { LoggerModule } from "src/logger/logger.module";
import { StreetNosheryEmailModelModule } from "./model/email-model.module";

@Module({
    providers: [NotificationService],
    exports: [NotificationService],
    controllers: [NotificationController],
    imports: [HttpModule, LoggerModule, StreetNosheryEmailModelModule]
})

export class NotificationModule {}