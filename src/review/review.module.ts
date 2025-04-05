import { Module } from "@nestjs/common";
import { StreetNosheryReviewService } from "./review.service";
import { StreetNosheryReviewController } from "./review.controller";
import { StreetnosheryReviewModelModule } from "./model/review-model.module";
import { StreetNosheryMenuModelHelperModule } from "src/menu/model/menu.module";

@Module({
    providers: [StreetNosheryReviewService],
    exports: [StreetNosheryReviewService],
    controllers: [StreetNosheryReviewController],
    imports: [StreetnosheryReviewModelModule, StreetNosheryMenuModelHelperModule]
})

export class StreetNosheryReviewModule {}