import { Injectable } from "@nestjs/common";
import { ReviewsDto } from "./dto/review.dto";
import { StreetNosheryReviewModelHelperService } from "./model/review-helper.service";
import { StreetNosheryMenuModelHelperService } from "src/menu/model/menu-modelhelper.service";
import { LoggerService } from "src/logger/logger.service";

const prefix = "STREET_NOSHERY_REVIEW_SERVICE"

@Injectable()
export class StreetNosheryReviewService {
    constructor(
        private readonly streetNosheryReviewModelHelperService: StreetNosheryReviewModelHelperService,
        private readonly menuModelHelperService: StreetNosheryMenuModelHelperService,
        private readonly logger: LoggerService
    ) { }

    async createOrUpdateReview(body: ReviewsDto) {
        try {
            const { shopId, customerId, stars, reviews } = body;

            const updateObj: any = {
                reviews: reviews,
                shopId,
                customerId,
                rating: stars
            }
            const res = await this.streetNosheryReviewModelHelperService.createOrupdate({ shopId, customerId }, updateObj);
            this.logger.log(`${prefix} (createOrUpdateReview) customerId: ${customerId} response: ${JSON.stringify(res)}`);
            return res;
        } catch (error) {
            this.logger.error(`${prefix} (createOrUpdateReview) Error: ${JSON.stringify(error)}`);
            throw error;
        }
    }

    async reviews(shopId: number) {
        try {

            const res = await this.streetNosheryReviewModelHelperService.getReviews({ shopId });
            this.logger.log(`${prefix} (reviews) SuccessFul response: ${JSON.stringify(res)}`);

            if (res.totalRating == 0) {
                throw new Error("Rating is not given for this shop.");
            }

            const totalRating = res.totalRating;
            const ratingCount = res.ratingCount;

            const averageRating = Math.round((totalRating / ratingCount) * 100) / 100; // Round to 2 decimal places
            return { 
                shopId: res._id, 
                totalRating, 
                ratingCount, 
                averageRating 
            };
        } catch (error) {
            this.logger.error(`${prefix} (reviews) Error: ${JSON.stringify(error)} `);
            throw error;
        }
    }

    async updateFoodReviews(body: ReviewsDto) {
        try {
            const { shopId, stars, foodId} = body;

            const res = await this.menuModelHelperService.updateFoodReview(shopId, foodId, stars);
            this.logger.log(`${prefix} (createOrUpdateReview) shopId: ${shopId} response: ${JSON.stringify(res)}`);
            return res;
        } catch (error) {
            this.logger.error(`${prefix} (createOrUpdateReview) Error: ${JSON.stringify(error)}`);
            throw error;
        }
    }
}