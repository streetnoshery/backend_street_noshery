import { Body, Controller, Get, Post } from "@nestjs/common";
import { StreetNosheryCustomerService } from "./customer.service";
import { StreetNosheryCreateCustomer } from "./dto/customer.dto";

const prefix = "[STREET_NOSHERY_CUSTOMER_CONTROLLER]"
@Controller("customer")
export class StreetNosheryCustomerController {
    constructor(
        private readonly streetNosheryCustomerService: StreetNosheryCustomerService
    ) {}

    @Get()
    async getUser() {
        return this.streetNosheryCustomerService.getUser();
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
}