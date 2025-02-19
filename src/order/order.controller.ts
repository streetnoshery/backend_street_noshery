import { Controller, Get, Query } from "@nestjs/common";
import { StreetnosheryOrderService } from "./order.service";

const prefix = "[STREET_NOSHERY_ORDER_CONTROLLER]"
@Controller("order")
export class StreetNosheryOrderController {
    constructor(
        private orderService: StreetnosheryOrderService
    ) {}

    @Get("")
    async getOrders(
        @Query("customerId") customerId: string
    ) {
        try {
            console.log(`${prefix} (getOrders) initiating get orders for customerId: ${customerId}`);
            const res = await this.orderService.getPastOrders(customerId);
            console.log(`${prefix} (getOrders) Successful fetched orders for customerId: ${customerId} | Response: ${JSON.stringify(res)}`);
            return res;
        } catch (error) {
            console.log(`${prefix} (getOrders) Error: ${JSON.stringify(error)}`);
            throw error;
        }
    }
}