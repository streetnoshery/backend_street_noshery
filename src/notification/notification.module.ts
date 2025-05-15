import { Module } from "@nestjs/common";
import { NotificationController } from "./notification.controller";
import { NotificationService } from "./notification.service";
import { HttpModule } from '@nestjs/axios';
import { LoggerModule } from "src/logger/logger.module";

@Module({
    providers: [NotificationService],
    exports: [NotificationService],
    controllers: [NotificationController],
    imports: [HttpModule, LoggerModule]
})

export class NotificationModule {}