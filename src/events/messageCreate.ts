import { Message } from "discord.js";
import { commands } from "../commandHandler";
import { readFileSync } from "fs";
import path from "path";
import dotenv from "dotenv";
dotenv.config();

const prefixesPath = path.join(__dirname, "../prefixes.json");

const loadPrefixes = () => {
    try {
        const data = readFileSync(prefixesPath, "utf8");
        return JSON.parse(data);
    } catch (error) {
        return {}; 
    }
};

export default {
    name: "messageCreate",
    execute: async (message: Message) => {
        const prefixes = loadPrefixes();
        const defaultPrefix = process.env.PREFIX || ";";
        const prefix = message.guild ? prefixes[message.guild.id] || defaultPrefix : defaultPrefix;

        if (!message.content.startsWith(prefix) || message.author.bot) return;

        const args = message.content.slice(prefix.length).trim().split(/ +/);
        const commandName = args.shift()?.toLowerCase();

        if (!commandName || !commands.has(commandName)) return;

        try {
            await commands.get(commandName).execute(undefined, message);
        } catch (error) {
            console.error(error);
            await message.reply("hubo un error al ejecutar el comando.");
        }
    },
};