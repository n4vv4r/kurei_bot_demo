import { CommandInteraction, Message, EmbedBuilder, User, GuildMember, TextChannel } from "discord.js";

export default {
    name: "userinfo",
    description: "muestra información de un usuario.",
    options: [
        {
            name: "usuario",
            description: "El usuario del que quieres ver la información (opcional)",
            type: 6, 
            required: false
        }
    ],
    execute: async (interaction?: CommandInteraction, message?: Message) => {
        let user: User | null = null;
        let member: GuildMember | null = null;

        if (interaction) {
            const userOption = interaction.options.get("usuario");
            user = userOption?.user ?? interaction.user;
        } else if (message) {
            user = message.mentions.users.first() ?? message.author;
        }

        if (!user) {
            if (interaction) await interaction.reply({ content: "no se pudo obtener la información del usuario.", ephemeral: false });
            else if (message) await message.reply("no se pudo obtener la información del usuario.");
            return;
        }

        if (interaction?.guild || message?.guild) {
            member = (interaction?.guild || message?.guild)!.members.cache.get(user.id) ?? null;
        }

        const fields = [
            { name: "nombre:", value: `${user.tag}`, inline: true },
            { name: "ID:", value: `${user.id}`, inline: true },
            { name: "cuenta creada:", value: `<t:${Math.floor(user.createdTimestamp / 1000)}:F>`, inline: false }
        ];

        if (member) {
            fields.push({ name: "se unió al servidor:", value: `<t:${Math.floor(member.joinedTimestamp! / 1000)}:F>`, inline: false });
        }

        const requester = interaction?.user || message?.author;
        if (!requester) {
            throw new Error("No se pudo determinar quién solicitó el comando.");
        }

        const embed = new EmbedBuilder()
            .setColor(0xa7a7a7)
            .setTitle(`info de ${user.username}`)
            .setThumbnail(user.displayAvatarURL({ size: 256 }))
            .addFields(fields)
            .setFooter({
                text: `solicitado por ${requester.tag}`,
                iconURL: requester.displayAvatarURL()
            })
            .setTimestamp();

        if (interaction) {
            await interaction.reply({ embeds: [embed] });
        } else if (message?.channel instanceof TextChannel) {
            await message.channel.send({ embeds: [embed] });
        }
    }
};