import { Injectable } from "@nestjs/common";
import { ReviewsDto } from "./dto/review.dto";
import { StreetNosheryReviewModelHelperService } from "./model/review-helper.service";

const prefix = "STREET_NOSHERY_REVIEW_SERVICE"

@Injectable()
export class StreetNosheryReviewService {
    constructor(
        private readonly streetNosheryReviewModelHelperService: StreetNosheryReviewModelHelperService
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
            return res;
        } catch (error) {
            console.log(`${prefix} (createOrUpdateReview) Error: ${JSON.stringify(error)}`);
            throw error;
        }
    }

    async reviews(shopId: number) {
        try {

            const res = await this.streetNosheryReviewModelHelperService.getReviews({ shopId });
            console.log(`${prefix} (reviews) SuccessFul response: ${JSON.stringify(res)}`);

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
            console.log(`${prefix} (reviews) Error: ${JSON.stringify(error)} `);
            throw error;
        }
    }
}