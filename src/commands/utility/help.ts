import { CommandInteraction, Message, EmbedBuilder, TextChannel, ButtonBuilder, ButtonStyle, ActionRowBuilder } from "discord.js";
import { readFileSync } from "fs";
import path from "path";
import dotenv from "dotenv";
dotenv.config();

const prefixesPath = path.join(__dirname, "../../prefixes.json");

const loadPrefixes = () => {
    try {
        const data = readFileSync(prefixesPath, "utf8");
        return JSON.parse(data);
    } catch (error) {
        return {}; 
    }
};

const commands = {
    utility: [
        { name: "ping", description: "muestra la latencia del bot." },
        { name: "setprefix", description: "cambia el prefijo del bot para este servidor." },
        { name: "avatar", description: "muestra el avatar de un usuario." },
        { name: "banner", description: "muestra el banner de un usuario." },
        { name: "userinfo", description: "muestra información de un usuario." },
        { name: "serverinfo", description: "muestra información del servidor." },
        { name: "remindme", description: "configura un recordatorio." },
        { name: "help", description: "muestra ayuda para el bot." }
        
    ],
    moderation: [], 
    social: [],     
    games: []       
};

export default {
    name: "help",
    description: "muestra la lista de comandos del bot.",
    execute: async (interaction?: CommandInteraction, message?: Message) => {
        const guild = interaction?.guild || message?.guild;
        const requester = interaction?.user || message?.author;

        if (!guild || !requester) {
            if (interaction) await interaction.reply({ content: "este comando solo funciona en servidores.", ephemeral: true });
            else if (message) await message.reply("este comando solo funciona en servidores.");
            return;
        }

        const prefixes = loadPrefixes();
        const defaultPrefix = process.env.PREFIX || ";";
        const prefix = prefixes[guild.id] || defaultPrefix;

        const utilityButton = new ButtonBuilder()
            .setCustomId("utility")
            .setLabel("Utilidades")
            .setStyle(ButtonStyle.Primary);
        const moderationButton = new ButtonBuilder()
            .setCustomId("moderation")
            .setLabel("Moderación")
            .setStyle(ButtonStyle.Primary);
        const socialButton = new ButtonBuilder()
            .setCustomId("social")
            .setLabel("Social")
            .setStyle(ButtonStyle.Primary);
        const gamesButton = new ButtonBuilder()
            .setCustomId("games")
            .setLabel("Juegos")
            .setStyle(ButtonStyle.Primary);

        const row = new ActionRowBuilder<ButtonBuilder>()
            .addComponents(utilityButton, moderationButton, socialButton, gamesButton);

        const embed = new EmbedBuilder()
            .setColor(0xa7a7a7)
            .setTitle("Menú de ayuda")
            .setDescription("Selecciona una categoría usando los botones abajo.")
            .setImage("https://i.pinimg.com/originals/fe/f8/65/fef865f1df5fa7bfefafaa56f4d7aaec.gif")

            .setFooter({
                text: `solicitado por ${requester.tag}`,
                iconURL: requester.displayAvatarURL()
            })
            .setTimestamp();

        const replyMessage = await (interaction 
            ? interaction.reply({ embeds: [embed], components: [row], fetchReply: true })
            : message?.channel instanceof TextChannel 
                ? message.channel.send({ embeds: [embed], components: [row] })
                : null);

        if (!replyMessage) return;

        const collector = replyMessage.createMessageComponentCollector({
            filter: i => i.user.id === requester.id,
            time: 300000 
        });

        collector.on("collect", async (i) => {
            let category: string;
            let title: string;

            switch (i.customId) {
                case "utility":
                    category = "utility";
                    title = "Comandos de Utilidades";
                    break;
                case "moderation":
                    category = "moderation";
                    title = "Comandos de Moderación";
                    break;
                case "social":
                    category = "social";
                    title = "Comandos Sociales";
                    break;
                case "games":
                    category = "games";
                    title = "Comandos de Juegos";
                    break;
                default:
                    return;
            }

            const commandList = commands[category as keyof typeof commands];
            embed.setTitle(title);

            if (commandList.length > 0) {
                embed.setDescription(
                    commandList.map(cmd => `**${prefix}${cmd.name}** - ${cmd.description}`).join("\n")
                );
            } else {
                embed.setDescription("No hay comandos en esta categoría aún.");
            }

            await i.update({ embeds: [embed], components: [row] });
        });

        collector.on("end", async () => {
            utilityButton.setDisabled(true);
            moderationButton.setDisabled(true);
            socialButton.setDisabled(true);
            gamesButton.setDisabled(true);
            const disabledRow = new ActionRowBuilder<ButtonBuilder>()
                .addComponents(utilityButton, moderationButton, socialButton, gamesButton);
            await replyMessage.edit({ components: [disabledRow] }).catch(() => null);
        });
    }
};