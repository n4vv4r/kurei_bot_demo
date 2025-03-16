import { CommandInteraction, Message, EmbedBuilder, TextChannel, Client } from "discord.js";
import { readFileSync, writeFileSync } from "fs";
import path from "path";

const remindersPath = path.join(__dirname, "../../reminders.json");
const MAX_TIME_MS = 30 * 24 * 60 * 60 * 1000; 

const loadReminders = () => {
    try {
        const data = readFileSync(remindersPath, "utf8");
        return JSON.parse(data);
    } catch (error) {
        return []; 
    }
};

const saveReminders = (reminders: any[]) => {
    writeFileSync(remindersPath, JSON.stringify(reminders, null, 2), "utf8");
};

// Convertir tiempo a milisegundos
const parseTimeToMs = (timeString: string): number | null => {
    const match = timeString.match(/^(\d+)([mhd])$/i);
    if (!match) return null;

    const amount = parseInt(match[1], 10);
    const unit = match[2].toLowerCase();

    let ms: number;
    switch (unit) {
        case "m": ms = amount * 60 * 1000; break; 
        case "h": ms = amount * 60 * 60 * 1000; break; 
        case "d": ms = amount * 24 * 60 * 60 * 1000; break; 
        default: return null;
    }

    return ms > MAX_TIME_MS ? null : ms; 
};

export const reloadReminders = (client: Client) => {
    const reminders = loadReminders();
    const now = Date.now();

    reminders.forEach((reminder: any) => {
        const timeElapsed = now - reminder.timeSet;
        const timeRemaining = reminder.timeMs - timeElapsed;

        if (timeRemaining > 0) {
            setTimeout(async () => {
                const guild = client.guilds.cache.get(reminder.guildId);
                if (!guild) return;

                const channel = guild.channels.cache.find(ch => ch.isTextBased() && !ch.isThread()) as TextChannel;
                if (!channel) return;

                const user = await client.users.fetch(reminder.userId).catch(() => null);
                if (!user) return;

                const embed = new EmbedBuilder()
                    .setColor(0xa7a7a7)
                    .setTitle("¡Recordatorio!")
                    .setDescription(reminder.message ? `${user}, te recordé: ${reminder.message}` : `${user}, no me dijiste para qué te tenía que recordar.`)
                    .setTimestamp();

                await channel.send({ content: `${user}`, embeds: [embed] });

                const updatedReminders = loadReminders().filter((r: any) => 
                    r.userId !== reminder.userId || r.timeSet !== reminder.timeSet
                );
                saveReminders(updatedReminders);
            }, timeRemaining);
        } else {
            const updatedReminders = reminders.filter((r: any) => 
                r.userId !== reminder.userId || r.timeSet !== reminder.timeSet
            );
            saveReminders(updatedReminders);
        }
    });
    console.log(`[OK] recargados ${reminders.length} recordatorios.`);
};

export default {
    name: "remindme",
    description: "configura un recordatorio para que te mencione después de un tiempo (máx. 30 días).",
    options: [
        {
            name: "tiempo",
            description: "Tiempo hasta el recordatorio (ej. 5m, 2h, 1d, máx. 30d)",
            type: 3, 
            required: true
        },
        {
            name: "mensaje",
            description: "Mensaje del recordatorio (máximo 200 caracteres)",
            type: 3, 
            required: false
        }
    ],
    execute: async (interaction?: CommandInteraction, message?: Message) => {
        let timeString: string | null = null;
        let reminderMessage: string | null = null;

        if (interaction) {
            timeString = interaction.options.get("tiempo")?.value as string | null;
            reminderMessage = interaction.options.get("mensaje")?.value as string | null;
        } else if (message) {
            const args = message.content.split(" ").slice(1); 
            if (args.length > 0) {
                timeString = args[0];
                reminderMessage = args.slice(1).join(" ") || null;
            }
        }

        if (!timeString) {
            if (interaction) await interaction.reply({ content: "debes especificar un tiempo (ej. 5m, 2h, 1d).", ephemeral: true });
            else if (message) await message.reply("debes especificar un tiempo (ej. 5m, 2h, 1d).");
            return;
        }

        const timeMs = parseTimeToMs(timeString);
        if (!timeMs) {
            if (interaction) await interaction.reply({ content: "formato de tiempo inválido o excede 30 días. usa ej. 5m (minutos), 2h (horas), 1d (días).", ephemeral: true });
            else if (message) await message.reply("formato de tiempo inválido o excede 30 días. usa ej. 5m (minutos), 2h (horas), 1d (días).");
            return;
        }

        if (reminderMessage && reminderMessage.length > 200) {
            if (interaction) await interaction.reply({ content: "el mensaje no puede superar los 200 caracteres.", ephemeral: true });
            else if (message) await message.reply("el mensaje no puede superar los 200 caracteres.");
            return;
        }

        const user = interaction?.user || message?.author;
        const guild = interaction?.guild || message?.guild;
        if (!user || !guild) {
            if (interaction) await interaction.reply({ content: "este comando solo funciona en servidores.", ephemeral: true });
            else if (message) await message.reply("este comando solo funciona en servidores.");
            return;
        }

        const requester = user;

        const reminders = loadReminders();

        const reminder = {
            guildId: guild.id,
            userId: user.id,
            timeSet: Date.now(),
            timeMs: timeMs,
            message: reminderMessage || null
        };

        reminders.push(reminder);
        saveReminders(reminders);

        setTimeout(async () => {
            const channel = guild.channels.cache.find(ch => ch.isTextBased() && !ch.isThread()) as TextChannel;
            if (!channel) return;

            const embed = new EmbedBuilder()
                .setColor(0xa7a7a7)
                .setTitle("¡Recordatorio!")
                .setDescription(reminderMessage ? `${user}, te recordé: *${reminderMessage}*` : `${user}, no me dijiste para qué te tenía que recordar.`)
                .setTimestamp();

            await channel.send({ content: `${user}`, embeds: [embed] });

            const updatedReminders = loadReminders().filter((r: any) => 
                r.userId !== reminder.userId || r.timeSet !== reminder.timeSet
            );
            saveReminders(updatedReminders);
        }, timeMs);

        const embed = new EmbedBuilder()
            .setColor(0xa7a7a7)
            .setTitle("recordatorio configurado")
            .setDescription(`te recordaré en ${timeString}. ${reminderMessage ? `Mensaje: *${reminderMessage}*` : "No especificaste mensaje."}`)
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