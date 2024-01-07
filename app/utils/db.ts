import mongoose from "mongoose";
import { logger } from "./logger";

const connectionString = process.env.MONGO_URL;

const connect = async () => {
  if (connectionString) {
    try {
      await mongoose.connect(connectionString, {});
      logger("Connected to DB");
    } catch (error) {
      logger(`Db connection Error: ${JSON.stringify(error)}`);
      throw Error("Some error ocurred while connection to DB");
    }
  } else {
    logger("Database Connection Error: no connectiong string found. db.ts");
  }
};

export {
    connect
}
