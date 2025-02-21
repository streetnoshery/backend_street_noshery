import { Body, Controller, Get, Post, Query } from "@nestjs/common";
import { StreetnosheryOrderService } from "./order.service";
import { CustomerOrderDto } from "./dto/order.dto";

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

    @Post("create")
    async createOrder(
        @Body() body: CustomerOrderDto
    ) {
        try {
            console.log(`${prefix} (createOrder) initiating create orders for customerId: ${body.customerId}`);
            const res = await this.orderService.createOrder(body);
            console.log(`${prefix} (createOrder) Successful order created Response: ${JSON.stringify(res)}`);
            return res;
        } catch (error) {
            console.log(`${prefix} (createOrder) Error: ${JSON.stringify(error)}`);
            throw error;
        }
    }
}