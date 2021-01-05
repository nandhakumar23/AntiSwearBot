const Discord = require("discord.js");
const { execSync } = require("child_process");
const { token} = require('./disc_config.json');
const fs = require('fs');


const client = new Discord.Client();
var isInVoice = false;
var connection = null;

client.login(token);

client.on("ready", () => {
    console.log(`Logged in as ${client.user.tag}!`);
});



client.on('message', async (message) => {

    if (message.content === 'ping') {
        message.reply('Pong!');
    }

    // Join the same voice channel of the author of the message
    if (message.member.voice.channel && message.content === 'join') {

        const user = message.member.id;
        connection = await message.member.voice.channel.join();

        isInVoice = true;
        // Create a ReadableStream of s16le PCM audio
        const audio = connection.receiver.createStream(user, { mode: 'opus' });

        audio.pipe(fs.createWriteStream('user_audio'));

        audio
            .on("data", (chunk) => console.log(chunk))
            .on("close", () => console.log("close"))
            .on("error", (e) => console.log(e))
            .on("readable", () => console.log("readable"))
            .on("close", () => console.log("closed"));

        //connection.play(audio, { type: 'opus' });
    }

    if(isInVoice && message.content === 'Run it back'){
        //connection.play('user_audio', {mode: 'opus'});
    }

    if(isInVoice && message.content === 'dc'){
        connection.disconnect();
        connection = null
    }

});

