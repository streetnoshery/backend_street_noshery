import { Controller, Post, Body} from "@nestjs/common";
import { NotificationService } from "./notification.service";
import { LoggerService } from "src/logger/logger.service";
import { MailDto, MobileNumbersDto } from "./dto/notification.dto";


const prefix = "[STREET_NOSHERY_SMS_CONTROLLER]"

@Controller("notification")
export class NotificationController {
    constructor(
        private readonly smsService: NotificationService,
        private readonly logger: LoggerService
    ) {

    }

    @Post("send-sms")
    async sendSMS() {
        try {
            this.logger.log(`${prefix} (sendSMS) Initiating`);
            const res = await this.smsService.sendSMSTwilio();
            this.logger.log(`${prefix} (sendSMS) Successful || data: ${JSON.stringify(res)}`);
            return res;
        } catch (error) {
            this.logger.error(`${prefix} (sendSMS) Error: ${JSON.stringify(error)}`);
            throw error;
        }
    }

    @Post("send-whatsapp")
    async sendWhatsAppNotifications(@Body() body: MobileNumbersDto) {
        try {
            this.logger.log(`${prefix} (sendSMS) Initiating`);
            const res = await this.smsService.sendWhatsAppMessages(body);
            this.logger.log(`${prefix} (sendSMS) Successful || data: ${JSON.stringify(res)}`);
            return res;
        } catch (error) {
            this.logger.error(`${prefix} (sendSMS) Error: ${JSON.stringify(error)}`);
            throw error;
        }
    }

    @Post("send-mail")
    async sendMail(@Body() body: MailDto) {
        try {
            this.logger.log(`${prefix} (sendMail) Initiating`);
            const res = this.smsService.sendPromotionalEmail(body).then((res) => {
                this.logger.log(`${prefix} (sendMail) Successful || data: ${JSON.stringify(res)}`);
            }).catch((error) => {
                this.logger.error(`${prefix} (sendMail) Error: ${JSON.stringify(error)}`);
                throw error;
            })
            this.logger.log(`${prefix} (sendMail) Successful || data: ${JSON.stringify(res)}`);
            return res;
        } catch (error) {
            this.logger.error(`${prefix} (sendMail) Error: ${JSON.stringify(error)}`);
            throw error;
        }
    }

    @Post("send-mail-resend")
    async sendResendMail(@Body() body: MailDto) {
        try {
            this.logger.log(`${prefix} (sendResendMail) Initiating`);
            const res = this.smsService.sendEmailViaResend(body).then((res) => {
                this.logger.log(`${prefix} (sendResendMail) Successful || data: ${JSON.stringify(res)}`);
            }).catch((error) => {
                this.logger.error(`${prefix} (sendResendMail) Error: ${JSON.stringify(error)}`);
                throw error;
            })
            this.logger.log(`${prefix} (sendResendMail) Successful || data: ${JSON.stringify(res)}`);
            return res;
        } catch (error) {
            this.logger.error(`${prefix} (sendResendMail) Error: ${JSON.stringify(error)}`);
            throw error;
        }
    }
}