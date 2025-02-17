import { Body, Controller, Get, Post, Query } from "@nestjs/common";
import { StreetNosherymenuService } from "./menu.service";
import { StreetNosheryMenuUpdateDto } from "./dto/menu.dto";
const prefix = "[STREET_NOSHERY_MENU_CONTROLLER]";

@Controller("menu")
export class StreetNosheryMenuController {
    constructor(
        private readonly streetNosheryMenuService: StreetNosherymenuService
    ) {}

    @Post("update-menu")
    async updateMenuForShop(
        @Body() body: StreetNosheryMenuUpdateDto
    ) {
        try {
            console.log(`${prefix} (updateMenuForShop) Initiating menu update for body: ${JSON.stringify(body)}`);
            const {shopId, ...result} = body;
            const res = await this.streetNosheryMenuService.createOrUpdateMenu(shopId, result);
            console.log(`${prefix} (updateMenuForShop) Successful res: ${JSON.stringify(res)}`);
            
            return res;
        } catch (error) {
            console.log(`${prefix} (updateMenuForShop) Error: ${JSON.stringify(error)}`);
            throw error;
        }
    }

    @Get("")
    async getMenuWithId(
        @Query("shopId") shopId: string
    ) {
        try {
            console.log(`${prefix} (getMenuWithId) Initiating menu update for shopId: ${JSON.stringify(shopId)}`);
            const res = await this.streetNosheryMenuService.getMenu(shopId);
            console.log(`${prefix} (getMenuWithId) Successful res: ${JSON.stringify(res)}`);
            return res;
        } catch (error) {
            console.log(`${prefix} (getMenuWithId) Error: ${JSON.stringify(error)}`);
            throw error;
        }
    }
}