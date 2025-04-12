import { Module } from "@nestjs/common";
import { NotificationController } from "./notification.controller";
import { NotificationService } from "./notification.service";
import { HttpModule } from '@nestjs/axios';

@Module({
    providers: [NotificationService],
    exports: [NotificationService],
    controllers: [NotificationController],
    imports: [HttpModule]
})

export class NotificationModule {}