import { CommandInteraction, Message, EmbedBuilder, User, TextChannel, ButtonBuilder, ButtonStyle, ActionRowBuilder } from "discord.js";

export default {
    name: "banner",
    description: "muestra el banner de un usuario (si tiene Nitro y lo ha configurado).",
    options: [
        {
            name: "usuario",
            description: "El usuario del que quieres ver el banner (opcional)",
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

        const fetchedUser = await user.fetch(); // Banner global
        const guild = interaction?.guild || message?.guild;
        const member = guild ? await guild.members.fetch(user.id).catch(() => null) : null; // Banner del servidor

        const globalBannerUrl = fetchedUser.bannerURL({ size: 1024 });
        const serverBannerUrl = member?.bannerURL({ size: 1024 });

        if (!globalBannerUrl && !serverBannerUrl) {
            const embed = new EmbedBuilder()
                .setColor(0xa7a7a7)
                .setTitle(`banner de ${user.username}`)
                .setDescription(`${user.username} no tiene un banner configurado ni global ni en este servidor.`)
                .setFooter({
                    text: `solicitado por ${requester.tag}`,
                    iconURL: requester.displayAvatarURL()
                })
                .setTimestamp();

            if (interaction) await interaction.reply({ embeds: [embed] });
            else if (message?.channel instanceof TextChannel) await message.channel.send({ embeds: [embed] });
            return;
        }

        let showingGlobal = globalBannerUrl ? true : false;

        const embed = new EmbedBuilder()
            .setColor(0xa7a7a7)
            .setFooter({
                text: `solicitado por ${requester.tag}`,
                iconURL: requester.displayAvatarURL()
            })
            .setTimestamp();

        if (showingGlobal) {
            embed.setTitle(`banner global de ${user.username}`).setImage(globalBannerUrl!);
        } else {
            embed.setTitle(`banner del servidor de ${user.username}`).setImage(serverBannerUrl!);
        }

        const toggleButton = new ButtonBuilder()
            .setCustomId("toggle_banner")
            .setLabel(showingGlobal && serverBannerUrl ? "Ver banner del servidor" : "Ver banner global")
            .setStyle(ButtonStyle.Primary)
            .setDisabled(!globalBannerUrl || !serverBannerUrl); // Deshabilitado si no hay ambos banners

        const row = new ActionRowBuilder<ButtonBuilder>().addComponents(toggleButton);

        const replyMessage = await (interaction 
            ? interaction.reply({ embeds: [embed], components: globalBannerUrl && serverBannerUrl ? [row] : [], fetchReply: true })
            : message?.channel instanceof TextChannel 
                ? message.channel.send({ embeds: [embed], components: globalBannerUrl && serverBannerUrl ? [row] : [] })
                : null);

        if (!replyMessage) return;

        const collector = replyMessage.createMessageComponentCollector({
            filter: i => i.user.id === requester.id,
            time: 300000 
        });

        collector.on("collect", async (i) => {
            if (i.customId === "toggle_banner") {
                showingGlobal = !showingGlobal; 

                if (showingGlobal) {
                    embed.setTitle(`banner global de ${user.username}`).setImage(globalBannerUrl!);
                    toggleButton.setLabel("Ver banner del servidor");
                } else {
                    embed.setTitle(`banner del servidor de ${user.username}`).setImage(serverBannerUrl!);
                    toggleButton.setLabel("Ver banner global");
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