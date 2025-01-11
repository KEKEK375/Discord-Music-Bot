const { joinVoiceChannel, createAudioResource, createAudioPlayer, AudioPlayerStatus } = require('@discordjs/voice');
const { ApplicationCommandOptionType, MessageEmbed } = require('discord.js');
const ytstream = require('yt-stream');

module.exports = {
    name: 'play',
    description: 'Plays the given link.',
    // devOnly: Boolean,
    // testOnly: Boolean,
    // deleted: Boolean,
    options: [
        {
            name: 'link',
            description: 'The link to the song.',
            required: true,
            type: ApplicationCommandOptionType.String,
        }
    ],
    // permissionsRequired: [PermissionFlagsBits.Administrator],
    // botPermissions: [PermissionFlagsBits.Administrator],

    callback: async (client, interaction)=> {
        console.log('Play command called');
        if (!interaction.member.voice.channel) {
            interaction.reply({
                content: "Join a voice channel first.",
                ephemeral: true,
            });
            return;
        }

        const connection = joinVoiceChannel({
            channelId: interaction.member.voice.channel.id,
            guildId: interaction.guild.id,
            adapterCreator: interaction.guild.voiceAdapterCreator,
        });
        console.log('Joined channel');

        let songLink = interaction.options.data[0].value;

        // DON'T REMOVE OR THE BOT WILL BREAK
        // This is needed or it will play the link twice
        const results = await ytstream.search(songLink);
        songLink = results[0].url;

        try {
        const stream = await ytstream.stream(songLink, {
            quality: 'high',
            type: 'audio',
            highWaterMark: 1048576 * 32,
            download: true
        });

        // DON'T REMOVE OR THE BOT WILL BREAK
        await new Promise(resolve => setTimeout(resolve, 100));

        const audioResource = createAudioResource(stream.stream, {
            inputType: 'webm/opus',
        }
        );

        const audioPlayer = createAudioPlayer();

        connection.subscribe(audioPlayer);
        audioPlayer.play(audioResource);

        audioPlayer.on(AudioPlayerStatus.Playing, () => {
            console.log(`Playing link: ${songLink}`);
            interaction.reply({
                content: "Playing Audio!",
            });
        });

        audioPlayer.on('error', (error) => {
            console.error('Audio player error:', error);
            interaction.reply({
                content: 'There was an error playing the audio.',
                ephemeral: true,
            });
        });

        audioPlayer.on(AudioPlayerStatus.Idle, () => {
            console.log('Audio has finished playing');
            connection.destroy(); // Leave the voice channel when done
        });
        } catch (error) {
            console.error('Error with YouTube stream:', error);
            interaction.reply({
                content: 'Failed to load or play the song.',
                ephemeral: true,
        });
        }
    }
};

// " https://www.youtube.com/watch?v=hSlb1ezRqfA "