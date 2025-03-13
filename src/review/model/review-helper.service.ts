import { Inject, Injectable } from "@nestjs/common";
import { FilterQuery, Model, UpdateQuery } from "mongoose";
import { REVIEWS } from "src/database/database-provider.constants";
import { IShop } from "./shop-reviews-model.model";

@Injectable()
export class StreetNosheryReviewModelHelperService {
    constructor(
        @Inject(REVIEWS)
        readonly reviewmodel: Model<IShop>
    ) {}

    async createOrupdate(filter: FilterQuery<IShop>, updateObj: UpdateQuery<IShop>) {
        return this.reviewmodel.findOneAndUpdate(filter, updateObj, {upsert: true, new: true}).lean();
    }

    async getReviews(filter: FilterQuery<IShop>,){
        const result = await this.reviewmodel.aggregate([
            { $match: filter}, // Filter by shopId
            {
                $group: {
                    _id: "$shopId",
                    totalRating: { $sum: "$rating" }, // Sum of ratings
                    ratingCount: { $sum: 1 } // Count of ratings
                }
            }
        ]);

        return result.length > 0 ? result[0] : { totalRating: 0, ratingCount: 0 };
    }
}