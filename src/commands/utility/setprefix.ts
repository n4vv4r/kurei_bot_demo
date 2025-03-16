import { CommandInteraction, Message, EmbedBuilder, TextChannel, PermissionsBitField } from "discord.js";
import { readFileSync, writeFileSync } from "fs";
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

const savePrefixes = (prefixes: { [key: string]: string }) => {
    writeFileSync(prefixesPath, JSON.stringify(prefixes, null, 2), "utf8");
};

export default {
    name: "setprefix",
    description: "cambia el prefijo del bot para este servidor (solo administradores).",
    options: [
        {
            name: "prefijo",
            description: "El nuevo prefijo para el servidor (máximo 5 caracteres)",
            type: 3, 
            required: true
        }
    ],
    execute: async (interaction?: CommandInteraction, message?: Message) => {
        let newPrefix: string | null = null;

        if (interaction) {
            newPrefix = interaction.options.get("prefijo")?.value as string | null;
        } else if (message) {
            const args = message.content.split(" ").slice(1); 
            newPrefix = args[0] || null;
        }

        if (!newPrefix) {
            if (interaction) await interaction.reply({ content: "debes especificar un nuevo prefijo.", ephemeral: true });
            else if (message) await message.reply("debes especificar un nuevo prefijo.");
            return;
        }

        if (newPrefix.length > 5) {
            if (interaction) await interaction.reply({ content: "el prefijo no puede superar los 5 caracteres.", ephemeral: true });
            else if (message) await message.reply("el prefijo no puede superar los 5 caracteres.");
            return;
        }

        const guild = interaction?.guild || message?.guild;
        const requester = interaction?.user || message?.author;
        const member = interaction?.member || (message ? await guild?.members.fetch(message.author.id) : null);

        if (!guild || !requester || !member) {
            if (interaction) await interaction.reply({ content: "este comando solo funciona en servidores.", ephemeral: true });
            else if (message) await message.reply("este comando solo funciona en servidores.");
            return;
        }

        const hasAdmin = (member instanceof Object && 'permissions' in member) 
        ? new PermissionsBitField(member.permissions as unknown as bigint).has(PermissionsBitField.Flags.Administrator) 
        : false;
    
    if (!hasAdmin) {
        if (interaction) await interaction.reply({ content: "solo los administradores pueden usar este comando.", ephemeral: true });
        else if (message) await message.reply("solo los administradores pueden usar este comando.");
        return;
    }

        const prefixes = loadPrefixes();

        prefixes[guild.id] = newPrefix;
        savePrefixes(prefixes);

        const embed = new EmbedBuilder()
            .setColor(0xa7a7a7)
            .setTitle("prefijo actualizado")
            .setDescription(`el nuevo prefijo para este servidor es: \`${newPrefix}\``)
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