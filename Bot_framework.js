const Discord = require("discord.js");
const { execSync } = require("child_process");
const { token} = require('./disc_config.json');
const fs = require('fs');
const { Readable } = require('stream')
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const ffmpeg = require('fluent-ffmpeg')
ffmpeg.setFfmpegPath(ffmpegPath);
const { exec } = require('child_process');

class Silence extends Readable {
    _read() {
        this.push(Buffer.from([0xF8, 0xFF, 0xFE]))
    }
}

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
    if (message.member.voice.channel && message.content === '+join') {

        const user = message.member.id;
        connection = await message.member.voice.channel.join();

        isInVoice = true;

        connection.play(new Silence(), { type: 'opus' })

        connection.on('speaking', (user, speaking) => {
            console.log(user.username, 'speaking:', speaking);

            if(speaking.bitfield == 0) return;

            // Create a ReadableStream of s16le PCM audio
            const receiver = connection.receiver.createStream(user, {
                mode: "pcm",
                end: "silence"
            });

            const writer = receiver.pipe(fs.createWriteStream(`./recorded-${user.id}.pcm`));
            writer.on("finish", function () {
                ffmpeg(`./recorded-${user.id}.pcm`)
                    .inputOptions(['-f s16le', '-ar 48000', '-channels 2'])
                    .outputOptions(['-f wav', '-ar 16000', '-ac 1'])
                    .save(`./recorded-${user.id}.wav`)
                    .on('end', function () {
                        exec(`python SpeechRec.py recorded-${user.id}.wav`, (error, stdout, stderr) => {

                            if (error) {
                                console.error(`error: ${error.message}`);
                                return;
                            }

                            if (stderr) {
                                console.error(`stderr: ${stderr}`);
                                return;
                            }
                            var output = stdout
                            if (output.text === "") return;
                            console.log(user.username, ": ", output.toString());
                            message.channel.send(user.username + ": " + output.toString());
                        });
                    })
            });
        });
    }

    if(message.content === '+Run it back'){ // temp command to re-play the listen to the audio that u just said.
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

    if(isInVoice && message.content === '+dc'){
        connection.disconnect();
        connection = null
        console.log("cleared");
    }

});

