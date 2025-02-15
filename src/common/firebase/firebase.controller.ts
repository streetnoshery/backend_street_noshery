import { Body, Controller, Get, Post, Query } from "@nestjs/common";
import { StreetNosheryFirebaseService } from "./firebase.service";
import { StreetNosheryFirebaseDto } from "./firebase.dto";

const prefix = "[FIREBASE_CONTROLLER]"
@Controller("firebase")
export class StreetNosheryFirebaseController {
    constructor(
        private firebaseService: StreetNosheryFirebaseService
    ){}

    @Post("upload")
    async uploadFirebaseData(
        @Body() body: StreetNosheryFirebaseDto
    ) {
        try {
            console.log(`${prefix} (uploadFirebaseData) initiating upload data to firestore`);
            const res = await this.firebaseService.uploadData(body);
            console.log(`${prefix} (uploadFirebaseData) Successful uploaded data to firestore`)
            return res;
        } catch (error) {
            console.log(`${prefix} (uploadFirebaseData) Error: ${JSON.stringify(error)}`);
            throw error;
        }
    }

    @Get("get")
    async getFirebaseData(
        @Query('collectionName') collectionName: string
    ) {
        try {
            console.log(`${prefix} (getFirebaseData) initiating get data from firestore`);
            const res = await this.firebaseService.getData(collectionName);
            console.log(`${prefix} (getFirebaseData) Successful get data from firestore`)
            return res;
        } catch (error) {
            console.log(`${prefix} (getFirebaseData) Error: ${JSON.stringify(error)}`);
            throw error;
        }
    }
}