import { CommandInteraction, Message, EmbedBuilder, TextChannel } from "discord.js";
import { performance } from "node:perf_hooks";

export default {
    name: "ping",
    description: "envia la latencia del bot. dev command.",
    execute: async (interaction?: CommandInteraction, message?: Message) => {
        const uptime = process.uptime(); 
        const botUptime = formatUptime(uptime);

        const start = performance.now();
        if (interaction) {
            await interaction.reply({ content: "Pinging...", ephemeral: true });

            const latency = performance.now() - start;
            const apiLatency = interaction.client.ws.ping; 

            const embed = new EmbedBuilder()
                .setColor("#a7a7a7")
                .addFields(
                    { name: "bot latency", value: `${Math.round(latency)}ms`, inline: true },
                    { name: "api latency", value: `${apiLatency}ms`, inline: true },
                    { name: "uptime", value: botUptime, inline: false }
                )
                .setTimestamp()
                .setFooter({ text: "rei bot status" });

            await interaction.editReply({ content: null, embeds: [embed] });
        } else if (message) {
            const channel = message.channel as TextChannel;
            
            if (!channel.isTextBased()) {
                console.error("El canal no es basado en texto");
                return;
            }

            const sentMessage = await channel.send("pinging...");
            
            const latency = sentMessage.createdTimestamp - message.createdTimestamp;
            const apiLatency = message.client.ws.ping; 

            const embed = new EmbedBuilder()
                .setColor("#a7a7a7")
                .addFields(
                    { name: "msg latency", value: `${latency}ms`, inline: true },
                    { name: "api latency", value: `${apiLatency}ms`, inline: true },
                    { name: "uptime", value: botUptime, inline: false }
                )
                .setTimestamp()
                .setFooter({ text: "rei bot status" });

            await sentMessage.edit({ content: null, embeds: [embed] });
        }
    },
};

function formatUptime(seconds: number): string {
    const days = Math.floor(seconds / (24 * 3600));
    const hours = Math.floor((seconds % (24 * 3600)) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    return `${days}d ${hours}h ${minutes}m ${secs}s`;
}