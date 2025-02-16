import { Body, Controller, Post } from "@nestjs/common";
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
}