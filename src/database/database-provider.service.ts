import mongoose, { Connection } from "mongoose";
import { CUSTOMER_DATABASE, DATABASE_CONNECTION } from "./database-provider.constants";
import { ConnectionOptions } from "tls";
import { ConfigService } from "@nestjs/config";
import { ICustomer, customerSchema } from "src/customer/model/customer-model.model";

export const databaseProvider = [{
    provide: DATABASE_CONNECTION,
    useFactory: (): Connection => {
        console.log(`Db URL: `);
        const connection = mongoose.createConnection("mongodb://localhost/street_noshery", {
            useNewUrlParser: true,
            useUnifiedTopology: true
        } as ConnectionOptions);

        connection.on('connected', () => {
            console.log(`DB connected`)
        });

        connection.on('error', (err) => {
            console.log(`Failed to connect DB`);
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
    }
]