import { REST, Routes, Client, Collection } from "discord.js";
import { readdirSync } from "fs";
import path from "path";
import dotenv from "dotenv";
dotenv.config();

const commands = new Collection<string, any>();
const slashCommands: any[] = [];

export const loadCommands = async (client: Client) => {
    const commandFolders = readdirSync(path.join(__dirname, "commands"));

    for (const folder of commandFolders) {
        const commandFiles = readdirSync(path.join(__dirname, "commands", folder)).filter(file => file.endsWith(".ts") || file.endsWith(".js"));

        for (const file of commandFiles) {
            const command = require(`./commands/${folder}/${file}`).default;
            if (!command.name || !command.execute) continue;
            
            commands.set(command.name, command);
            slashCommands.push({ 
                name: command.name, 
                description: command.description,
                options: command.options || [] 
            });
        }
    }

    console.log(`[OK] cargados ${commands.size} comandos.`);
};

export const registerSlashCommands = async (client: Client) => {
    const rest = new REST({ version: "10" }).setToken(process.env.BOT_TOKEN as string);
    const deployMode = process.env.DEPLOY_MODE || "global"; 
    const guildId = process.env.GUILD_ID;

    try {
        console.log("Registering slash commands...");
        
        if (deployMode === "guild" && guildId) {
            await rest.put(
                Routes.applicationGuildCommands(process.env.CLIENT_ID as string, guildId),
                { body: slashCommands }
            );
            console.log(`[OK] slash commands registrados en el guild ${guildId}.`);
        } else {
            await rest.put(
                Routes.applicationCommands(process.env.CLIENT_ID as string),
                { body: slashCommands }
            );
            console.log("[OK] slash commands registrados globalmente.");
        }
    } catch (error) {
        console.error("[!] error registrando slash commands:", error);
    }
};

export { commands };