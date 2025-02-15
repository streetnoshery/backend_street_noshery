import { Injectable } from "@nestjs/common";
const {uploadProcessedData} = require("./firebase_utils");

const prefix = "[FIREBASE_SERVICE]";
@Injectable()
export class StreetNosheryFirebaseService {
    constructor() {

    }

    async uploadData() {
        try {
            return uploadProcessedData();
        } catch (error) {
            console.log(`${prefix} (uploadData) Error: ${JSON.stringify(error)}`);
            throw error;
        }
    }
}