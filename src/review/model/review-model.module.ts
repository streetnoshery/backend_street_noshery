import { Module } from "@nestjs/common";
import { StreetNosheryReviewModelHelperService } from "./review-helper.service";
import { DatabaseProvider } from "src/database/database-provider.module";

@Module({
    providers: [StreetNosheryReviewModelHelperService],
    exports: [StreetNosheryReviewModelHelperService],
    imports: [DatabaseProvider]
})

export class StreetnosheryReviewModelModule {}