import { Injectable } from "@nestjs/common";
import { StreetNosheryMenuModelHelperService } from "./model/menu-modelhelper.service";
import { Menu } from "./interface/menu.interface";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { EventHnadlerEnums } from "src/common/events/enums";
const prefix = "[STREET_NOSHERY_MENU_SERVICE]"

@Injectable()
export class StreetNosherymenuService {
    constructor(
        private readonly StreetNosheryModelHelperService: StreetNosheryMenuModelHelperService,
        private readonly emitterService: EventEmitter2
    ) {}

    async createOrUpdateMenu(shopId: number, menu: Menu) {
        try {
            const res = await this.StreetNosheryModelHelperService.createOrupdateMenu({shopId}, menu);
            console.log(`${prefix} (createOrUpdateMenu) Successful res: ${JSON.stringify(res)}`);
            const {_id, __v, ...result} = res;
            this.emitterService.emit(EventHnadlerEnums.MENU_UPDATE, {shopId: result.shopId, data: result})
            return res;
        } catch (error) {
            console.log(`${prefix} (createOrUpdateMenu) Error: ${JSON.stringify(error)}`);
            throw error;
        }
    }
}