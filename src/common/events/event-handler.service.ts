import { Injectable } from "@nestjs/common";
import { OnEvent } from "@nestjs/event-emitter";
import { EventHnadlerEnums } from "./enums";
import { StreetNosheryFirebaseService } from "../firebase/firebase.service";
import { FirebaseCollections } from "../common.utils";
const prefix = "[EVENT_HANDLER_SERVICE]"

@Injectable()
export class StreetNosheryEventhandlerService {
    constructor(
        private readonly firebaseService: StreetNosheryFirebaseService
    ) {

    }

    @OnEvent(EventHnadlerEnums.CUSTOMER_DETAILS_REFRESH, {
        async: true
    })
    async refreshCustomerData(
        input: {
            data: any,
            customerId: string
        }
    ) {
        try {
            if (!input.customerId) return;
            const collectionName = FirebaseCollections.CUSTOMERS;
            const document = input.customerId;
            const res = await this.firebaseService.uploadData({data: input.data, collection: collectionName, document})
        } catch (error) {
            console.log(`${prefix} (refreshCustomerData) Error: ${JSON.stringify(error)}`);
            throw error;
        }
    }
}