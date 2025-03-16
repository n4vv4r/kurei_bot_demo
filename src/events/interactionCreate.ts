import { CommandInteraction } from "discord.js";
import { commands } from "../commandHandler";
import dotenv from "dotenv";
dotenv.config();

export default {
    name: "interactionCreate",
    execute: async (interaction: CommandInteraction) => {
        if (!interaction.isCommand()) return;

        const command = commands.get(interaction.commandName);
        if (!command) return;

        try {
            await command.execute(interaction);
        } catch (error) {
            console.error(error);
            await interaction.reply({ content: "error ejecutando comando.", ephemeral: true });
        }
    },
};
