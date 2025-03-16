import { CommandInteraction, Message, EmbedBuilder, User, TextChannel, ButtonBuilder, ButtonStyle, ActionRowBuilder } from "discord.js";

export default {
    name: "avatar",
    description: "muestra el avatar de un usuario.",
    options: [
        {
            name: "usuario",
            description: "El usuario del que quieres ver el avatar (opcional)",
            type: 6, 
            required: false
        }
    ],
    execute: async (interaction?: CommandInteraction, message?: Message) => {
        let user: User | null = null;

        if (interaction) {
            const userOption = interaction.options.get("usuario");
            user = userOption?.user ?? interaction.user;
        } else if (message) {
            user = message.mentions.users.first() ?? message.author;
        }

        if (!user) {
            if (interaction) await interaction.reply({ content: "no se pudo obtener el usuario.", ephemeral: true });
            else if (message) await message.reply("no se pudo obtener el usuario.");
            return;
        }

        const requester = interaction?.user || message?.author;
        if (!requester) {
            throw new Error("No se pudo determinar quién solicitó el comando.");
        }

        const guild = interaction?.guild || message?.guild;
        const member = guild ? await guild.members.fetch(user.id).catch(() => null) : null; 

        const globalAvatarUrl = user.displayAvatarURL({ size: 1024 }); 
        const serverAvatarUrl = member?.displayAvatarURL({ size: 1024 }); 

        if (!serverAvatarUrl || serverAvatarUrl === globalAvatarUrl) {
            const embed = new EmbedBuilder()
                .setColor(0xa7a7a7)
                .setTitle(`avatar de ${user.username}`)
                .setImage(globalAvatarUrl)
                .setFooter({
                    text: `solicitado por ${requester.tag}`,
                    iconURL: requester.displayAvatarURL()
                })
                .setTimestamp();

            if (interaction) await interaction.reply({ embeds: [embed] });
            else if (message?.channel instanceof TextChannel) await message.channel.send({ embeds: [embed] });
            return;
        }

        let showingGlobal = true;

        const embed = new EmbedBuilder()
            .setColor(0xa7a7a7)
            .setFooter({
                text: `solicitado por ${requester.tag}`,
                iconURL: requester.displayAvatarURL()
            })
            .setTimestamp();

        embed.setTitle(`avatar global de ${user.username}`).setImage(globalAvatarUrl);

        const toggleButton = new ButtonBuilder()
            .setCustomId("toggle_avatar")
            .setLabel("Ver avatar del servidor")
            .setStyle(ButtonStyle.Primary);

        const row = new ActionRowBuilder<ButtonBuilder>().addComponents(toggleButton);

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
            if (i.customId === "toggle_avatar") {
                showingGlobal = !showingGlobal;

                if (showingGlobal) {
                    embed.setTitle(`avatar global de ${user.username}`).setImage(globalAvatarUrl);
                    toggleButton.setLabel("Ver avatar del servidor");
                } else {
                    embed.setTitle(`avatar del servidor de ${user.username}`).setImage(serverAvatarUrl);
                    toggleButton.setLabel("Ver avatar global");
                }

                await i.update({ embeds: [embed], components: [row] });
            }
        });

        collector.on("end", async () => {
            toggleButton.setDisabled(true);
            const disabledRow = new ActionRowBuilder<ButtonBuilder>().addComponents(toggleButton);
            await replyMessage.edit({ components: [disabledRow] }).catch(() => null);
        });
    }
};