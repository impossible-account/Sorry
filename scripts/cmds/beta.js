const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { createCanvas, loadImage } = require('canvas');

module.exports = {
  config: {
    name: "beta",
    aliases: [],
    version: "2.0",
    author: "Team Calyx",
    countDown: 0,
    role: 0,
    shortDescription: "Generate 4 images and preview in one",
    category: "ai",
    guide: {
      en: "{pn} <prompt> [--ar <ratio>]",
      ar: "{pn} <المطالبة> [--ar <النسبة>]"
    },
  },

  onStart: async function ({ message, event, args, api }) {
    const prompt = args.slice(0, args.indexOf("--ar") > -1 ? args.indexOf("--ar") : args.length).join(" ");
    const ratio = args.includes("--ar") ? args.slice(args.indexOf("--ar") + 1).join("").trim() : "2:3";

    const imagePaths = [];
    api.setMessageReaction("⏳", event.messageID, () => {}, true);

    try {
      for (let i = 1; i <= 4; i++) {
        const url = `http://194.164.125.5:6165/beta?prompt=${encodeURIComponent(prompt)}&ratio=${ratio}`;
        const filePath = path.join(__dirname, "cache", `img_${Date.now()}_${i}.png`);
        const writer = fs.createWriteStream(filePath);
        const response = await axios({ url, method: 'GET', responseType: 'stream' });
        response.data.pipe(writer);
        await new Promise((resolve, reject) => {
          writer.on('finish', resolve);
          writer.on('error', reject);
        });
        imagePaths.push(filePath);
      }

      const images = await Promise.all(imagePaths.map(p => loadImage(p)));
      const width = images[0].width;
      const height = images[0].height;
      const canvas = createCanvas(width * 2, height * 2);
      const ctx = canvas.getContext('2d');

      ctx.drawImage(images[0], 0, 0, width, height);
      ctx.drawImage(images[1], width, 0, width, height);
      ctx.drawImage(images[2], 0, height, width, height);
      ctx.drawImage(images[3], width, height, width, height);

      ctx.font = "bold 40px Arial";
      ctx.fillStyle = "white";
      ctx.strokeStyle = "black";
      ctx.lineWidth = 3;

      ctx.strokeText("1", 20, 50); ctx.fillText("1", 20, 50);
      ctx.strokeText("2", width + 20, 50); ctx.fillText("2", width + 20, 50);
      ctx.strokeText("3", 20, height + 50); ctx.fillText("3", 20, height + 50);
      ctx.strokeText("4", width + 20, height + 50); ctx.fillText("4", width + 20, height + 50);

      const previewPath = path.join(__dirname, "cache", `preview_${Date.now()}.png`);
      const out = fs.createWriteStream(previewPath);
      const stream = canvas.createPNGStream();
      stream.pipe(out);
      await new Promise((resolve) => out.on('finish', resolve));

      message.reply({
        body: "Here are 4 generated images:\n→ Reply with number (1-4) to get that image.",
        attachment: fs.createReadStream(previewPath)
      }, async (err, info) => {
        if (err) return;
        fs.unlinkSync(previewPath);

        global.GoatBot = global.GoatBot || {};
        global.GoatBot.onReply = global.GoatBot.onReply || new Map();
        global.GoatBot.onReply.set(info.messageID, {
          commandName: this.config.name,
          author: event.senderID,
          images: imagePaths
        });

        setTimeout(() => {
          const data = global.GoatBot.onReply.get(info.messageID);
          if (data) {
            data.images.forEach(p => fs.existsSync(p) && fs.unlinkSync(p));
            global.GoatBot.onReply.delete(info.messageID);
          }
        }, 5 * 60 * 1000); 
      });

      api.setMessageReaction("✅", event.messageID, () => {}, true);
    } catch (err) {
      console.error(err);
      api.setMessageReaction("❌", event.messageID, () => {}, true);
      message.reply("❌ | Failed to generate images.");
    }
  },

  onReply: async function ({ message, event }) {
    const replyData = global.GoatBot.onReply?.get(event.messageReply.messageID);
    if (!replyData || replyData.author !== event.senderID) return;

    try {
      const index = parseInt(event.body.trim());
      if (isNaN(index) || index < 1 || index > 4) {
        return message.reply("❌ | Invalid selection. Please reply with a number between 1 and 4.");
      }

      const selectedImagePath = replyData.images[index - 1];
      if (fs.existsSync(selectedImagePath)) {
        await message.reply({
          body: ``,
          attachment: fs.createReadStream(selectedImagePath)
        });
      } else {
        message.reply("❌ | Image not found.");
      }

    } catch (error) {
      console.error("Error:", error.message);
      message.reply("❌ | Failed to send selected image.");
    }
  }
};