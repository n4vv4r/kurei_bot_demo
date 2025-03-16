import { Client, GatewayIntentBits, ActivityType } from "discord.js";
import { loadCommands, registerSlashCommands } from "./commandHandler";
import { readdirSync } from "fs";
import path from "path";
import dotenv from "dotenv";
dotenv.config();

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
});

(async () => {
    await loadCommands(client);
    await registerSlashCommands(client);
})();


const activities = [
    { name: "Roblox", type: ActivityType.Playing },
    { name: "Ariana Grande", type: ActivityType.Listening },
    { name: "Nana", type: ActivityType.Watching },
    { name: "alondrissa", type: ActivityType.Streaming, url: "https://twitch.tv/alondrissa" },
    { name: "i <3 rei", type: ActivityType.Competing }
];


const cycleActivities = () => {
    const randomActivity = activities[Math.floor(Math.random() * activities.length)];

    
    client.user?.setPresence({
        status: "online", 
        activities: [
            {
                name: randomActivity.name,
                type: randomActivity.type,
                url: randomActivity.url || undefined, 
            },
        ],
    });

    console.log(`status cambiado a: ${randomActivity.name}`);
};


setInterval(cycleActivities, 15000); 

client.on("ready", () => {
    console.log(`Logged in as ${client.user?.tag}!`);

    cycleActivities();
});


const eventFiles = readdirSync(path.join(__dirname, "events")).filter(file => file.endsWith(".ts") || file.endsWith(".js"));
for (const file of eventFiles) {
    const event = require(`./events/${file}`).default;
    if (event.name) {
        client.on(event.name, event.execute);
    }
}

client.login(process.env.BOT_TOKEN);
