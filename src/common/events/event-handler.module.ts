import { Module } from "@nestjs/common";
import { StreetNosheryEventhandlerService } from "./event-handler.service";
import { StreetNosheryFirebaseModule } from "../firebase/firebase.module";

@Module({
    providers: [StreetNosheryEventhandlerService],
    exports: [StreetNosheryEventhandlerService],
    imports: [StreetNosheryFirebaseModule]
})

export class StreetNosheryEventhandlerModule{}