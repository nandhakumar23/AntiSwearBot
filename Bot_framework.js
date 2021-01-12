const Discord = require("discord.js");
const { execSync } = require("child_process");
const { token} = require('./disc_config.json');
const fs = require('fs');
const { Readable } = require('stream')
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const ffmpeg = require('fluent-ffmpeg')
const readJsonSync = require('read-json-sync');
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
        var ConnectedChannel = message.member.voice.channel

        isInVoice = true;

        connection.play(new Silence(), { type: 'opus' })

        connection.on('speaking', (user, speaking) => {

            if(!user.bot) { //

                console.log(user.username, 'speaking:', speaking);

                if (speaking.bitfield == 0) return;

                // Create a ReadableStream of s16le PCM audio
                const receiver = connection.receiver.createStream(user, {
                    mode: "pcm",
                    end: "silence"
                });

                const writer = receiver.pipe(fs.createWriteStream(`./recorded-${user.id}.pcm`));
                writer.on("finish", function () {
                    var filename = `./recorded-${user.id}.wav`
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
                                var output = stdout;

                                if (output.toString() === "") return;

                                console.log(user.username, ": ", output.toString());

                                var JSONinfo = JSON.parse(stdout)

                                if (JSONinfo.toString() === "") return;
                                //console.log(user.username, ": ", output.text);


                                if (JSONinfo.hasOwnProperty('Profanity')) {
                                    //do stuff if the key exist

                                    var isProfanity = JSONinfo['Profanity'];

                                    if (isProfanity === true || isProfanity === "true") {

                                        if (JSONinfo.hasOwnProperty('Wit')) {

                                            var WitOutput = JSONinfo['Wit'];

                                            const Embed = new Discord.MessageEmbed()
                                                .setColor('#0099ff')
                                                .setTitle('Kicked From VoiceChannel')
                                                .setURL('https://i.kym-cdn.com/photos/images/original/001/299/189/6bb.jpg')
                                                .setAuthor('Jesus', 'https://st.depositphotos.com/1000975/2477/i/950/depositphotos_24770375-stock-photo-nun-with-gun-isolated-on.jpg')
                                                .setDescription('Christian Server, no swearing.')
                                                .setThumbnail('https://pbs.twimg.com/media/ETYqt0eXgAAvw8_?format=jpg&name=4096x4096')
                                                .addFields(
                                                    { name: 'Offender', value: user.toString() },
                                                    { name: 'Offense', value: 'Swearing in VC', inline: true },
                                                    { name: 'Punishment', value: 'Timeout corner?', inline: true },
                                                )
                                                .addField('Speech 2 text value', WitOutput.toString(), true)
                                                .setImage('https://pbs.twimg.com/media/ETYqt0eXgAAvw8_?format=jpg&name=4096x4096')
                                                .setTimestamp();

                                            const file = new Discord.MessageAttachment(filename);

                                            message.channel.send({ files: [file], embed: Embed });

                                            ConnectedChannel.members.forEach((member) => {
                                                if(member.id === user.id){
                                                    member.voice.kick()
                                                }
                                            });




                                        } else {

                                            var SphinxOutput = JSONinfo['Sphinx'];

                                            const Embed = new Discord.MessageEmbed()
                                                .setColor('#0099ff')
                                                .setTitle('Kicked From VoiceChannel')
                                                .setURL('https://i.kym-cdn.com/photos/images/original/001/299/189/6bb.jpg')
                                                .setAuthor('Jesus', 'https://st.depositphotos.com/1000975/2477/i/950/depositphotos_24770375-stock-photo-nun-with-gun-isolated-on.jpg')
                                                .setDescription('Christian Server, no swearing.')
                                                .setThumbnail('https://pbs.twimg.com/media/ETYqt0eXgAAvw8_?format=jpg&name=4096x4096')
                                                .addFields(
                                                    { name: 'Offender', value: user.toString() },
                                                    { name: 'Offense', value: 'Swearing in VC', inline: true },
                                                    { name: 'Punishment', value: 'Timeout corner?', inline: true },
                                                )
                                                .addField('Speech 2 text value', SphinxOutput.toString(), true)
                                                .setImage('https://pbs.twimg.com/media/ETYqt0eXgAAvw8_?format=jpg&name=4096x4096')
                                                .setTimestamp();

                                            const file = new Discord.MessageAttachment(filename);
                                            //var meember = guild.member(user);
                                            message.channel.send({ files: [file], embed: Embed });

                                            ConnectedChannel.members.forEach((member) => {
                                                if(member.id === user.id){
                                                    member.voice.kick()
                                                }
                                            });
                                        }

                                    }

                                }

                            });
                        })
                });
            }
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

