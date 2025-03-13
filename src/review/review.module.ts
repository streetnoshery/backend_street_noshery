import { Module } from "@nestjs/common";
import { StreetNosheryReviewService } from "./review.service";
import { StreetNosheryReviewController } from "./review.controller";
import { StreetnosheryReviewModelModule } from "./model/review-model.module";

@Module({
    providers: [StreetNosheryReviewService],
    exports: [StreetNosheryReviewService],
    controllers: [StreetNosheryReviewController],
    imports: [StreetnosheryReviewModelModule]
})

export class StreetNosheryReviewModule {}