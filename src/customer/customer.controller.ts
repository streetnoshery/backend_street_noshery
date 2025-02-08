import { Controller, Get } from "@nestjs/common";
import { StreetNosheryCustomerService } from "./customer.service";

@Controller("customer")
export class StreetNosheryCustomerController {
    constructor(
        private readonly streetNosheryCustomerService: StreetNosheryCustomerService
    ) {}

    @Get()
    async getUser() {
        return this.streetNosheryCustomerService.getUser();
    }
}