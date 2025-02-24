import { Body, Controller, Get, Post, Query } from "@nestjs/common";
import { StreetNosheryCustomerService } from "./customer.service";
import { StreetNosheryCreateCustomer } from "./dto/customer.dto";
import { StreetNosheryGenerateOtp } from "./dto/otp.dto";

const prefix = "[STREET_NOSHERY_CUSTOMER_CONTROLLER]"
@Controller("customer")
export class StreetNosheryCustomerController {
    constructor(
        private readonly streetNosheryCustomerService: StreetNosheryCustomerService
    ) {}

    @Get()
    async getUser(
        @Query("customerId") customerId: string
    ) {
        try {
            console.log(`${prefix} (getUser) Initiating || data: customerId: ${customerId}`);
            const res = await this.streetNosheryCustomerService.getUser(customerId);
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
}