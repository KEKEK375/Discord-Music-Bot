module.exports = {
    name: 'ping',
    description: 'Pong!',
    // devOnly: Boolean,
    // testOnly: Boolean,
    // deleted: Boolean,
    // options: Object[],
    // permissionsRequired: [PermissionFlagsBits.Administrator],
    // botPermissions: [PermissionFlagsBits.Administrator],

    callback: (client, interaction)=> {
        interaction.reply(`Pong! ${client.ws.ping}ms`);
    },
};