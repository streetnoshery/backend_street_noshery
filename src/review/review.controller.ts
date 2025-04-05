import { Body, Controller, Get, Post, Query } from "@nestjs/common";
import { ReviewsDto } from "./dto/review.dto";
import { StreetNosheryReviewService } from "./review.service";

const prefix = "STREET_NOSHERY_REVIEW_CONTROLLER"

@Controller("review")
export class StreetNosheryReviewController {
    constructor(
        private readonly streetNosheryReviewService: StreetNosheryReviewService
    ) {

    }

    @Get()
    async getShopReviews(
        @Query("shopId") shopId: number
    ) {
        try {
            console.log(`${prefix} (getShopReviews) Initiating || shopId: ${shopId}`);
            const res = await this.streetNosheryReviewService.reviews(shopId);
            console.log(`${prefix} (reviews) SuccessFul response: ${JSON.stringify(res)}`)
            return res;
        } catch (error) {
            console.log(`${prefix} (getShopReviews) Error: ${JSON.stringify(error)}`);
            throw error;
        }
    }

    @Post("create")
    async updateOrCreateReview(
        @Body() body: ReviewsDto
    ) {
        try {
            console.log(`${prefix} (updateOrCreateReview) Initiating || body: ${JSON.stringify(body)}`);
            const res = await this.streetNosheryReviewService.createOrUpdateReview(body);
            console.log(`${prefix} (updateOrCreateReview) Successful response: ${JSON.stringify(res)}`);
            return res;
        } catch (error) {
            console.log(`${prefix} (updateOrCreateReview) Error: ${JSON.stringify(error)}`);
            throw error;
        }
    }

    @Post("create-food-review")
    async createFoodReview(@Body() body: ReviewsDto) {
        try {
            console.log(`${prefix} (createFoodReview) Initiating || body: ${JSON.stringify(body)}`);
            const res = await this.streetNosheryReviewService.updateFoodReviews(body);
            console.log(`${prefix} (createFoodReview) Successful response: ${JSON.stringify(res)}`);
            return res;
        } catch (error) {
            console.log(`${prefix} (createFoodReview) Error: ${JSON.stringify(error)}`);
            throw error;
        }
    }
}