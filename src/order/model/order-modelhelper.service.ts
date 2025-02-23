import { Inject, Injectable } from "@nestjs/common";
import { FilterQuery, Model, UpdateQuery } from "mongoose";
import { ORDERS } from "src/database/database-provider.constants";
import { ICustomerOrderData } from "./order.model";

@Injectable()
export class StreetNosheryOrderModelHelperService {
    constructor(
        @Inject(ORDERS)
        private readonly streetNosheryOrdersmodel: Model<ICustomerOrderData>
    ) {}

    async createOrupdateOrder(filter: FilterQuery<ICustomerOrderData>, updateObject: UpdateQuery<ICustomerOrderData>) {
        return this.streetNosheryOrdersmodel.findOneAndUpdate(filter, updateObject, {upsert: true, new: true}).lean();
    }

    async getPastOrders(filter: FilterQuery<ICustomerOrderData>) {
        return this.streetNosheryOrdersmodel.find(filter).sort({ orderPlacedAt: -1 }).exec();
    }
}