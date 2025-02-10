import { Inject, Injectable } from "@nestjs/common";
import { FilterQuery, Model, UpdateQuery} from "mongoose";
import { CUSTOMER_DATABASE } from "src/database/database-provider.constants";
import { ICustomer } from "./customer-model.model";

@Injectable()
export class StreetNosheryCustomerModelHelper {
    constructor(
        @Inject(CUSTOMER_DATABASE)
        private customerModelhelper: Model<ICustomer>
    ) {

    }

    async createUser(filter: FilterQuery<ICustomer>, createUser: UpdateQuery<ICustomer>) {
        return this.customerModelhelper.findOneAndUpdate(filter, createUser, {
            upsert: true,
            new: true
        })
    }
}