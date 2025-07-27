import { Inject, Injectable } from "@nestjs/common";
import { Model, UpdateQuery } from "mongoose";
import { EMAILS } from "src/database/database-provider.constants";
import { IEmail } from "./email.model";

@Injectable()
export class StreetNosheryEmailModelHelperService {
    constructor(
        @Inject(EMAILS)
        private readonly emailModelHelper: Model<IEmail>
    ) {
        
    }

    async createUserEmail(createData: UpdateQuery<IEmail>){
        return this.emailModelHelper.findOneAndUpdate({email: createData.email}, createData, {upsert: true, new: true})
    }

    async getUserEmail(filter: {email: string}) {
        return this.emailModelHelper.findOne({email: filter.email}).lean()
    }
}