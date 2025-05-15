import { Body, Controller, Get, Post, Query } from "@nestjs/common";
import { StreetNosherymenuService } from "./menu.service";
import { StreetNosheryMenuUpdateDto } from "./dto/menu.dto";
import { LoggerService } from "src/logger/logger.service";
const prefix = "[STREET_NOSHERY_MENU_CONTROLLER]";

@Controller("menu")
export class StreetNosheryMenuController {
    constructor(
        private readonly streetNosheryMenuService: StreetNosherymenuService,
        private readonly logger: LoggerService
    ) {}

    @Post("update-menu")
    async updateMenuForShop(
        @Body() body: StreetNosheryMenuUpdateDto
    ) {
        try {
            this.logger.log(`${prefix} (updateMenuForShop) Initiating menu update for body: ${JSON.stringify(body)}`);
            const {shopId, ...result} = body;
            const res = await this.streetNosheryMenuService.createOrUpdateMenu(shopId, result);
            this.logger.log(`${prefix} (updateMenuForShop) Successful res: ${JSON.stringify(res)}`);
            
            return res;
        } catch (error) {
            this.logger.error(`${prefix} (updateMenuForShop) Error: ${JSON.stringify(error)}`);
            throw error;
        }
    }

    @Get("")
    async getMenuWithId(
        @Query("shopId") shopId: string
    ) {
        try {
            this.logger.log(`${prefix} (getMenuWithId) Initiating menu update for shopId: ${JSON.stringify(shopId)}`);
            const res = await this.streetNosheryMenuService.getMenu(shopId);
            this.logger.log(`${prefix} (getMenuWithId) Successful res: ${JSON.stringify(res)}`);
            return res;
        } catch (error) {
            this.logger.error(`${prefix} (getMenuWithId) Error: ${JSON.stringify(error)}`);
            throw error;
        }
    }
}