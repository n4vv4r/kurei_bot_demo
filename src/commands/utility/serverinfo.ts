import { CommandInteraction, Message, EmbedBuilder, TextChannel } from "discord.js";

export default {
    name: "serverinfo",
    description: "muestra información del servidor.",
    execute: async (interaction?: CommandInteraction, message?: Message) => {
        const guild = interaction?.guild || message?.guild;

        if (!guild) {
            if (interaction) await interaction.reply({ content: "este comando solo puede usarse en un servidor.", ephemeral: true });
            else if (message) await message.reply("este comando solo puede usarse en un servidor.");
            return;
        }

        const owner = await guild.fetchOwner();
        const memberCount = guild.memberCount;
        const channelCount = guild.channels.cache.size;
        const roleCount = guild.roles.cache.size;
        const boostLevel = guild.premiumTier; 
        const boostCount = guild.premiumSubscriptionCount || 0; 

        const fields = [
            { name: "nombre:", value: `${guild.name}`, inline: true },
            { name: "ID:", value: `${guild.id}`, inline: true },
            { name: "dueño:", value: `${owner.user.tag}`, inline: true },
            { name: "miembros:", value: `${memberCount}`, inline: true },
            { name: "canales:", value: `${channelCount}`, inline: true },
            { name: "roles:", value: `${roleCount}`, inline: true },
            { name: "nivel de boost:", value: `Nivel ${boostLevel} (${boostCount} boosts)`, inline: true },
            { name: "creado el:", value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:F>`, inline: false }
        ];

        const requester = interaction?.user || message?.author;
        if (!requester) {
            throw new Error("No se pudo determinar quién solicitó el comando.");
        }

        const embed = new EmbedBuilder()
            .setColor(0xa7a7a7)
            .setTitle(`info de ${guild.name}`)
            .setThumbnail(guild.iconURL({ size: 256 }) || null)
            .addFields(fields)
            .setFooter({
                text: `solicitado por ${requester.tag}`,
                iconURL: requester.displayAvatarURL()
            })
            .setTimestamp();

        if (boostLevel >= 2 && guild.bannerURL()) {
            embed.setImage(guild.bannerURL({ size: 1024 })); 
        }

        let inviteBackground = null;
        if (boostLevel >= 1) {
            const invitableChannel = guild.channels.cache.find(ch => 
                ch.isTextBased() && !ch.isThread() && ch.type === 0 
            ) as TextChannel | undefined;

            if (invitableChannel) {
                const invite = await guild.invites.create(invitableChannel, { maxAge: 0, maxUses: 0 });
                inviteBackground = guild.splashURL({ size: 1024 });
                await invite.delete(); 
            } else {
                console.warn("No se encontró un canal de texto válido para crear una invitación.");
            }
        }

        if (interaction) {
            await interaction.reply({ embeds: [embed] });
            if (inviteBackground) {
                await interaction.followUp({ embeds: [new EmbedBuilder().setColor(0xa7a7a7).setImage(inviteBackground).setTitle("Fondo de invitación")] });
            }
        } else if (message?.channel instanceof TextChannel) {
            await message.channel.send({ embeds: [embed] });
            if (inviteBackground) {
                await message.channel.send({ embeds: [new EmbedBuilder().setColor(0xa7a7a7).setImage(inviteBackground).setTitle("Fondo de invitación")] });
            }
        }
    }
};