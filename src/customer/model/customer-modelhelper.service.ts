import { Inject, Injectable } from "@nestjs/common";
import { FilterQuery, Model, UpdateQuery } from "mongoose";
import { CUSTOMER_DATABASE, CUSTOMER_OTP, SHOPEMAILS } from "src/database/database-provider.constants";
import { ICustomer } from "./customer-model.model";
import { inject } from "dd-trace";
import { ICustomerOtp } from "./customer-otp.model";
import { IShopEmails } from "./shop-emails.model";

@Injectable()
export class StreetNosheryCustomerModelHelper {
    constructor(
        @Inject(CUSTOMER_DATABASE)
        private customerModelhelper: Model<ICustomer>,

        @Inject(CUSTOMER_OTP)
        private customerOtpModelHelper: Model<ICustomerOtp>,

        @Inject(SHOPEMAILS)
        private shopEmails: Model<IShopEmails>
    ) {

    }

    async createOrUpdateUser(filter: FilterQuery<ICustomer>, createUser: UpdateQuery<ICustomer>) {
        return this.customerModelhelper.findOneAndUpdate(filter, createUser, {
            upsert: true,
            new: true
        }).lean();
    }

    async getUser(filter: FilterQuery<ICustomer>) {
        return this.customerModelhelper.findOne(filter).lean();
    }

    async otp(filter: FilterQuery<ICustomerOtp>, update: UpdateQuery<ICustomerOtp>) {
        return this.customerOtpModelHelper.findOneAndUpdate(filter,
            update, {
            upsert: true,
            new: true
        })
    }

    async getOtp(filter: FilterQuery<ICustomerOtp>) {
        return this.customerOtpModelHelper.findOne(filter).lean();
    }

    async getEmail(filter: FilterQuery<IShopEmails>) {
        return this.shopEmails.findOne(filter).lean();
    }
}