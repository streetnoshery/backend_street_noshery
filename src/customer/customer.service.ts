import { Injectable } from "@nestjs/common";
import { StreetNosheryCreateCustomer } from "./dto/customer.dto";
import { StreetNosheryCustomerModelHelper } from "./model/customer-modelhelper.service";

const prefix = "[STREET_NOSHERY_CUSTOMER_SERVICE]"
@Injectable()
export class StreetNosheryCustomerService {
    constructor(
        private readonly streetNosheryCustomerModelhelper: StreetNosheryCustomerModelHelper
    ) {}

    async getUser() {
        return{ name: "sumit"}
    }

    async createUser(body: StreetNosheryCreateCustomer) {
        try {
            const {mobileNumber, countryCode} = body;
            const res = await this.streetNosheryCustomerModelhelper.createUser({mobileNumber}, {
                mobileNumber,
                countryCode
            });
            console.log(`${prefix} (createUser) Successful || Response: ${JSON.stringify(res)}`);
            return res;
        } catch (error) {
            console.log(`${prefix} (createUser) Error: ${JSON.stringify(error)}`);
            throw error;
        }
    }
}