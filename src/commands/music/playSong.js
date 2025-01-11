const { joinVoiceChannel, createAudioResource, createAudioPlayer, AudioPlayerStatus } = require('@discordjs/voice');
const { ApplicationCommandOptionType, MessageEmbed } = require('discord.js');
const ytstream = require('yt-stream');
const waitForStream = require('../../utils/waitForStream');

ytstream.parseAudio = function(formats){
    const audio = [];
    var audioFormats = formats.filter(f => f.mimeType.startsWith('audio/webm; codecs="opus"'));
    for(var i = 0; i < audioFormats.length; i++){
        var format = audioFormats[i];
        const type = format.mimeType;
        if(type.startsWith('audio')){
            format.codec = type.split('codecs=')[1].split('"')[0];
            format.container = type.split('audio/')[1].split(';')[0];
            audio.push(format);
        }
    }
    return audio;
}

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
        const songTitle = results[0].title;

        try {
        const stream = await ytstream.stream(songLink, {
            quality: 'high',
            type: 'audio',
            highWaterMark: 1048576 * 32,
            download: true
        });

        // DON'T REMOVE OR THE BOT WILL BREAK
        await waitForStream(stream.stream, 10);

        const audioResource = createAudioResource(stream.stream, {
            inputType: 'webm/opus',
        }
        );

        const audioPlayer = createAudioPlayer();

        connection.subscribe(audioPlayer);
        audioPlayer.play(audioResource);

        audioPlayer.on(AudioPlayerStatus.Playing, () => {
            console.log(`Playing link: ${songLink}`);
            console.log(`Song title: ${songTitle}`);
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