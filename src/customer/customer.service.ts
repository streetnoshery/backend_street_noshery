import { Injectable } from "@nestjs/common";

@Injectable()
export class StreetNosheryCustomerService {
    constructor() {}

    async getUser() {
        return{ name: "sumit"}
    }
}