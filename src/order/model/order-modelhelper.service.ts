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

    async createOrupdateOrder(orderTrackId: string, updateObject: UpdateQuery<ICustomerOrderData>) {
        return this.streetNosheryOrdersmodel.findOneAndUpdate({orderTrackId}, updateObject, {upsert: true, new: true}).lean();
    }
}