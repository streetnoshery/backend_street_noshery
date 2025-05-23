import { BadRequestException, Injectable } from "@nestjs/common";
import { StreetNosheryMenuModelHelperService } from "./model/menu-modelhelper.service";
import { Menu } from "./interface/menu.interface";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { EventHnadlerEnums } from "src/common/events/enums";
import { exceptionMapper } from "src/common/errormapper/exception-mapper";
import { ExceptionMessage } from "src/common/errormapper/error-mapper.utils";
import { LoggerService } from "src/logger/logger.service";
const prefix = "[STREET_NOSHERY_MENU_SERVICE]"

@Injectable()
export class StreetNosherymenuService {
    constructor(
        private readonly StreetNosheryModelHelperService: StreetNosheryMenuModelHelperService,
        private readonly emitterService: EventEmitter2,
        private readonly logger: LoggerService
    ) {}

    async createOrUpdateMenu(shopId: number, menu: Menu) {
        try {
            const updateMenu = {
                ...menu,
                foodId: this.randomFoodId()
            }
            const res = await this.StreetNosheryModelHelperService.createOrupdateMenu({shopId}, updateMenu);
            this.logger.log(`${prefix} (createOrUpdateMenu) Successful res: ${JSON.stringify(res)}`);
            const {_id, __v, ...result} = res;
            this.emitterService.emit(EventHnadlerEnums.MENU_UPDATE, {shopId: result.shopId, data: result})
            return res;
        } catch (error) {
            this.logger.error(`${prefix} (createOrUpdateMenu) Error: ${JSON.stringify(error)}`);
            throw error;
        }
    }

    randomFoodId() {
        return Math.floor(100000 + Math.random() * 900000).toString();
    }

    async getMenu(shopId: string) {
        try {
            const res = await this.StreetNosheryModelHelperService.getMenuWithShopId(shopId);

            if(!res) {
                this.logger.error(`${prefix} (getMenu) menu npt exists for shopId: ${shopId}`)
                throw new BadRequestException(exceptionMapper(ExceptionMessage.MENU_NOT_EXISTS));
            }
            this.logger.log(`${prefix} (getMenu) Successful res: ${JSON.stringify(res)}`);
            return res;
        } catch (error) {
            this.logger.error(`${prefix} (getMenu) Error: ${JSON.stringify(error)}`);
            throw error;
        }
    }
}