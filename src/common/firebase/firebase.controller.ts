import { Controller, Post } from "@nestjs/common";
import { StreetNosheryFirebaseService } from "./firebase.service";

const prefix = "[FIREBASE_CONTROLLER]"
@Controller("firebase")
export class StreetNosheryFirebaseController {
    constructor(
        private firebaseService: StreetNosheryFirebaseService
    ){}

    @Post("upload")
    async uploadFirebaseData() {
        try {
            console.log(`${prefix} (uploadFirebaseData) initiating upload data to firestore`);
            const res = await this.firebaseService.uploadData();
            console.log(`${prefix} (uploadFirebaseData) Successful uploaded data to firestore`)
            return res;
        } catch (error) {
            console.log(`${prefix} (uploadFirebaseData) Error: ${JSON.stringify(error)}`);
            throw error;
        }
    }
}