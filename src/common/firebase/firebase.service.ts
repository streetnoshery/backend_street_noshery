import { Injectable } from "@nestjs/common";
const {uploadProcessedData, getTheData} = require("./firebase_utils");

const prefix = "[FIREBASE_SERVICE]";
@Injectable()
export class StreetNosheryFirebaseService {
    constructor() {

    }

    async uploadData(input: {data: any, collection: string, document: string}) {
        try {
            const {data, collection, document} = input;
            return uploadProcessedData(data, collection, document);
        } catch (error) {
            console.log(`${prefix} (uploadData) Error: ${JSON.stringify(error)}`);
            throw error;
        }
    }

    async getData(collectionName: string) {
        try {
            return getTheData(collectionName);
        } catch (error) {
            console.log(`${prefix} (getData) Error: ${JSON.stringify(error)}`);
            throw error;
        }
    }
}