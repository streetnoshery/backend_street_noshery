import { Module } from "@nestjs/common";
import { StreetNosheryFirebaseService } from "./firebase.service";
import { StreetNosheryFirebaseController } from "./firebase.controller";

@Module({
    exports: [StreetNosheryFirebaseService],
    providers: [StreetNosheryFirebaseService],
    controllers: [StreetNosheryFirebaseController]
})
export class StreetNosheryFirebaseModule{}