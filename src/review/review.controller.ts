import { Body, Controller, Get, Post, Query } from "@nestjs/common";
import { ReviewsDto } from "./dto/review.dto";
import { StreetNosheryReviewService } from "./review.service";
import { LoggerService } from "src/logger/logger.service";

const prefix = "STREET_NOSHERY_REVIEW_CONTROLLER"

@Controller("review")
export class StreetNosheryReviewController {
    constructor(
        private readonly streetNosheryReviewService: StreetNosheryReviewService,
        private readonly logger: LoggerService
    ) {

    }

    @Get()
    async getShopReviews(
        @Query("shopId") shopId: number
    ) {
        try {
            this.logger.log(`${prefix} (getShopReviews) Initiating || shopId: ${shopId}`);
            const res = await this.streetNosheryReviewService.reviews(shopId);
            this.logger.log(`${prefix} (reviews) SuccessFul response: ${JSON.stringify(res)}`)
            return res;
        } catch (error) {
            this.logger.error(`${prefix} (getShopReviews) Error: ${JSON.stringify(error)}`);
            throw error;
        }
    }

    @Post("create")
    async updateOrCreateReview(
        @Body() body: ReviewsDto
    ) {
        try {
            this.logger.log(`${prefix} (updateOrCreateReview) Initiating || body: ${JSON.stringify(body)}`);
            const res = await this.streetNosheryReviewService.createOrUpdateReview(body);
            this.logger.log(`${prefix} (updateOrCreateReview) Successful response: ${JSON.stringify(res)}`);
            return res;
        } catch (error) {
            this.logger.error(`${prefix} (updateOrCreateReview) Error: ${JSON.stringify(error)}`);
            throw error;
        }
    }

    @Post("create-food-review")
    async createFoodReview(@Body() body: ReviewsDto) {
        try {
            this.logger.log(`${prefix} (createFoodReview) Initiating || body: ${JSON.stringify(body)}`);
            const res = await this.streetNosheryReviewService.updateFoodReviews(body);
            this.logger.log(`${prefix} (createFoodReview) Successful response: ${JSON.stringify(res)}`);
            return res;
        } catch (error) {
            this.logger.error(`${prefix} (createFoodReview) Error: ${JSON.stringify(error)}`);
            throw error;
        }
    }
}