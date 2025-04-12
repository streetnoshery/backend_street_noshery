import { Controller, Post } from "@nestjs/common";
import { NotificationService } from "./notification.service";

const prefix = "[STREET_NOSHERY_SMS_CONTROLLER]"

@Controller("notification")
export class NotificationController {
    constructor(
        private readonly smsService: NotificationService
    ) {

    }

    @Post("send-sms")
    async sendSMS() {
        try {
            console.log(`${prefix} (sendSMS) Initiating`);
            const res = await this.smsService.sendSMSTwilio();
            console.log(`${prefix} (sendSMS) Successful || data: ${JSON.stringify(res)}`);
            return res;
        } catch (error) {
            console.log(`${prefix} (sendSMS) Error: ${JSON.stringify(error)}`);
            throw error;
        }
    }
}