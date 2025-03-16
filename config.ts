import dotenv from "dotenv";
dotenv.config();

export default {
    token: process.env.BOT_TOKEN as string,
    clientId: process.env.CLIENT_ID as string,
    prefix: process.env.PREFIX || ";"
};
