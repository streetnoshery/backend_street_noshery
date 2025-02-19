import { Injectable } from "@nestjs/common";
import { StreetNosheryOrderModelHelperService } from "./model/order-modelhelper.service";

const prefic = "[STREET_NOSHERY_ORDER_SERVICE]"
@Injectable()
export class StreetnosheryOrderService {
    constructor(
        private readonly orderModelHelperService: StreetNosheryOrderModelHelperService
    ) {}

    async getPastOrders(customerId: string) {
        try {
            const res = await this.orderModelHelperService.getPastOrders({customerId})
        } catch (error) {
            console.log(`${prefic} (getPastOrders) Error: ${JSON.stringify(error)}`);
            throw error;
        }
    }
}