import { Inject, Injectable } from "@nestjs/common";
import { FilterQuery, Model, UpdateQuery } from "mongoose";
import { MENU } from "src/database/database-provider.constants";
import { IMenu } from "./menu.model";

@Injectable()
export class StreetNosheryMenuModelHelperService {
    constructor(
        @Inject(MENU)
        private menuModel: Model<IMenu>
    ) {}

    async createOrupdateMenu(filter: FilterQuery<IMenu>, updateObj: UpdateQuery<IMenu>) {
        return  this.menuModel.findOneAndUpdate(
            filter,  // Filter by shopId
            { 
                $push: { menu: updateObj }  // Push new dish to the menu array
            },
            { 
                upsert: true,       // Create new document if not exists
                new: true           // Return the updated document
            }
        ).lean();
    }

    async getMenuWithShopId(shopId: string) {
        return this.menuModel.findOne({shopId}).lean();
    }

    async updateFoodReview(shopId: number, foodIds: number[], rating: number) {
        return this.menuModel.updateOne(
            { shopId: shopId },
            [
              {
                $set: {
                  menu: {
                    $map: {
                      input: "$menu",
                      as: "item",
                      in: {
                        $cond: [
                          { $in: ["$$item.foodId", foodIds] },
                          {
                            $mergeObjects: [
                              "$$item",
                              {
                                ratingCount: { $add: ["$$item.ratingCount", 1] },
                                rating: {
                                  $divide: [
                                    { $add: [
                                      { $multiply: ["$$item.rating", "$$item.ratingCount"] },
                                      rating
                                    ]},
                                    { $add: ["$$item.ratingCount", 1] }
                                  ]
                                }
                              }
                            ]
                          },
                          "$$item"
                        ]
                      }
                    }
                  }
                }
              }
            ]
          );
    }
}