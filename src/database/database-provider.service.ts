import mongoose, { Connection, ConnectOptions} from "mongoose";
import { CUSTOMER_DATABASE, CUSTOMER_OTP, DATABASE_CONNECTION, MENU, ORDERS, REVIEWS } from "./database-provider.constants";
import { ConfigService } from "@nestjs/config";
import { ICustomer, customerSchema } from "src/customer/model/customer-model.model";
import { ICustomerOtp, customerOtpSchema } from "src/customer/model/customer-otp.model";
import { IMenu, MenuSchema } from "src/menu/model/menu.model";
import { ICustomerOrderData, customerOrderDataSchema } from "src/order/model/order.model";
import { IShop, ShopSchema } from "src/review/model/shop-reviews-model.model";
require("dotenv").config();

const MONGO_URL = process.env.MONGO_URL

export const databaseProvider = [{
    provide: DATABASE_CONNECTION,
    useFactory: (): Connection => {
        console.log(`Db URL: ${MONGO_URL}`);
        const connection = mongoose.createConnection(MONGO_URL, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        } as ConnectOptions);

        connection.on('connected', () => {
            console.log(`DB url: ${MONGO_URL}`);
            console.log(`DB connected`)
        });

        connection.on('error', (err) => {
            console.log(`Failed to connect DB`);
            console.log(`DB url: ${MONGO_URL}`);
            console.log(`Error: ${JSON.stringify(err)}`)
        });

        return connection;
    },
    inject: [ConfigService]
},
    {
        provide: CUSTOMER_DATABASE,
        useFactory: (connection: mongoose.Connection) => {
            const customer = connection.model<ICustomer>(
                "streetnosherycustomer",
                customerSchema,
                "customer"
            )
            customer.syncIndexes();
            return customer;
        },
        inject: [DATABASE_CONNECTION, ConfigService]
    },
    {
        provide: CUSTOMER_OTP,
        useFactory: (connection: mongoose.Connection) => {
            const customerOtp = connection.model<ICustomerOtp>(
                "streetnosherycustomerotp",
                customerOtpSchema,
                "customer_otp"
            )
            customerOtp.syncIndexes();
            return customerOtp;
        },
        inject: [DATABASE_CONNECTION, ConfigService]
    },
    {
        provide: MENU,
        useFactory: (connection: mongoose.Connection) => {
            const menu = connection.model<IMenu>(
                "streetnosherymenu",
                MenuSchema,
                "menu"
            )
            menu.syncIndexes();
            return menu;
        },
        inject: [DATABASE_CONNECTION, ConfigService]
    },
    {
        provide: ORDERS,
        useFactory: (connection: mongoose.Connection) => {
            const menu = connection.model<ICustomerOrderData>(
                "streetnosheryorders",
                customerOrderDataSchema,
                "orders"
            )
            menu.syncIndexes();
            return menu;
        },
        inject: [DATABASE_CONNECTION, ConfigService]
    },
    {
        provide: REVIEWS,
        useFactory: (connection: mongoose.Connection) => {
            const review = connection.model<IShop>(
                "streetnosheryshopreviews",
                ShopSchema,
                "reviews"
            )
            review.syncIndexes();
            return review;
        },
        inject: [DATABASE_CONNECTION, ConfigService]
    }
]