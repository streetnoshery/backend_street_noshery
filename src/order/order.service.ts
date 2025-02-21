import { Injectable } from "@nestjs/common";
import { StreetNosheryOrderModelHelperService } from "./model/order-modelhelper.service";
import { CustomerOrderDto } from "./dto/order.dto";
import { CustomerOrderStatus } from "./enums/order.enum";

const prefic = "[STREET_NOSHERY_ORDER_SERVICE]"
@Injectable()
export class StreetnosheryOrderService {
    constructor(
        private readonly orderModelHelperService: StreetNosheryOrderModelHelperService
    ) { }

    async getPastOrders(customerId: string) {
        try {
            const res = await this.orderModelHelperService.getPastOrders({ customerId });
            console.log(`${prefic} (getPastOrders) Response: ${JSON.stringify(res)}`);
            return res;
        } catch (error) {
            console.log(`${prefic} (getPastOrders) Error: ${JSON.stringify(error)}`);
            throw error;
        }
    }

    async createOrder(order: CustomerOrderDto) {
        try {
            const orderTrackingId = this.generateOrderTrackId();
            const updateObject = {
                customerId: order.customerId,
                shopId: order.shopId,
                orderItems: order.orderItems,
                orderTrackId: orderTrackingId,
                orderStatus: CustomerOrderStatus.CONFIRMED,
                orderConfirmedAt: new Date()
            }
            const res = await this.orderModelHelperService.createOrupdateOrder(orderTrackingId, updateObject);
            console.log(`${prefic} (createOrder) Order created successfully for trackingId: ${orderTrackingId}`);
            return res;
        } catch (error) {
            console.log(`${prefic} (createOrder) Error: ${JSON.stringify(error)}`);
            throw error;
        }
    }

    generateOrderTrackId() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let uniqueId = '';

        for (let i = 0; i < 16; i++) {
            uniqueId += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return uniqueId;
    }
}