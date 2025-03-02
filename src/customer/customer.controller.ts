import { Body, Controller, Get, Patch, Post, Query } from "@nestjs/common";
import { StreetNosheryCustomerService } from "./customer.service";
import { StreetNosheryCreateCustomer, StreetNosheryEnableNotification } from "./dto/customer.dto";
import { StreetNosheryGenerateOtp } from "./dto/otp.dto";

const prefix = "[STREET_NOSHERY_CUSTOMER_CONTROLLER]"
@Controller("customer")
export class StreetNosheryCustomerController {
    constructor(
        private readonly streetNosheryCustomerService: StreetNosheryCustomerService
    ) {}

    @Get()
    async getUser(
        @Query("mobileNumber") mobileNumber: string
    ) {
        try {
            console.log(`${prefix} (getUser) Initiating`);
            const res = await this.streetNosheryCustomerService.getUser(mobileNumber);
            console.log(`${prefix} (getUser) Successful || Response: ${JSON.stringify(res)}`);
            return res;
        } catch (error) {
            console.log(`${prefix} (getUser) Error: ${JSON.stringify(error)}`);
            throw error;
        }
    }

    @Post("create")
    async createuser(
        @Body() body: StreetNosheryCreateCustomer
    ) {
        try {
            console.log(`${prefix} (createuser) Initiating || data: ${JSON.stringify(body)}`);
            const res = await this.streetNosheryCustomerService.createUser(body);
            console.log(`${prefix} (createuser) Successful || Response: ${JSON.stringify(res)}`);
            return res;
        } catch (error) {
            console.log(`${prefix} (createuser) Error: ${JSON.stringify(error)}`);
            throw error;
        }
    }

    @Post("generate-otp")
    async generateOtp(
        @Body() body: StreetNosheryGenerateOtp
    ) {
        try {
            console.log(`${prefix} (generateOtp) Initiating || data: ${JSON.stringify(body)}`);
            const res = await this.streetNosheryCustomerService.generateOtp(body);
        } catch (error) {
            console.log(`${prefix} (generateOtp) Error: ${JSON.stringify(error)}`);
            throw error;
        }
    }

    @Post("verify-otp")
    async verifyOtp(
        @Body() body: StreetNosheryGenerateOtp
    ) {
        try {
            console.log(`${prefix} (verifyOtp) Initiating || data: ${JSON.stringify(body)}`);
            const res = await this.streetNosheryCustomerService.verifyOtp(body);
        } catch (error) {
            console.log(`${prefix} (verifyOtp) Error: ${JSON.stringify(error)}`);
            throw error;
        }
    }

    @Post("enable-notification")
    async enableEmailNotification(
        @Body() body: StreetNosheryEnableNotification
    ) {
        try {
            console.log(`${prefix} (enableEmailNotification) Initiating || data: ${JSON.stringify(body.customerId)}`);
            const res = await this.streetNosheryCustomerService.enableEmailNotification({customerId: body.customerId, isEnable: body.isEnable});
            return res;
        } catch (error) {
            console.log(`${prefix} (enableEmailNotification) Error: ${JSON.stringify(error)}`);
            throw error;
        }
    }
}