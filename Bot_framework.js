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
        const receiver = connection.receiver.createStream(message.member, {
            mode: "pcm",
            end: "silence"
        });

        const writer = receiver.pipe(fs.createWriteStream(`./recorded-${message.author.id}.pcm`));
        writer.on("finish", () => {
            message.member.voice.channel.leave();
            message.channel.send("Finished writing audio");
        });
    }

    if(message.content === 'Run it back'){ // temp command to re-play the listen to the audio that u just said.
        //connection.play('user_audio', {mode: 'opus'});

        const voicechannel = message.member.voice.channel;

        if (!fs.existsSync(`./recorded-${message.author.id}.pcm`)) return message.channel.send("Your audio is not recorded!");

        const connection = await message.member.voice.channel.join();
        const stream = fs.createReadStream(`./recorded-${message.author.id}.pcm`);

        const dispatcher = connection.play(stream, {
            type: "converted"
        });

        dispatcher.on("finish", () => {
            message.member.voice.channel.leave();
            return message.channel.send("finished playing audio");
        })

    }

    if(isInVoice && message.content === 'dc'){
        connection.disconnect();
        connection = null
        console.log("cleared");
    }

});

