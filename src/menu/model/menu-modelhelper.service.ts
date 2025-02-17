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
}