const axios = require('axios');
const fs = require('fs');
const path = require('path');

module.exports = {
 config: {
 name: "gen",
 version: "1.0",
 author: "Aryan Chauhan",
 shortDescription: "Generate img",
 longDescription: "generate images",
 category: "ai",
 guide: {
 en: "`"
 }
 },

 onStart: async function ({ message, args, event, api }) {
 try {
 const prompt = args.join(" ");
 if (!prompt) {
 return api.sendMessage("Please provide a prompt", event.threadID, event.messageID);
 }

 const loadingMsg = await api.sendMessage(`Generating your image...`, event.threadID);

 const response = await axios.get(`https://aryanchauhanapi2.onrender.com/api/mid?prompt=${encodeURIComponent(prompt)}`, {
 responseType: 'stream'
 });

 const filePath = path.join(__dirname, `ai_art_${event.senderID}.png`);
 const writer = fs.createWriteStream(filePath);
 response.data.pipe(writer);

 writer.on('finish', async () => {
 await api.sendMessage({
 body: `✅ | Here's your image\nPrompt: "${prompt}"`,
 attachment: fs.createReadStream(filePath)
 }, event.threadID);

 if (loadingMsg.messageID) api.unsendMessage(loadingMsg.messageID);
 fs.unlinkSync(filePath);
 });

 writer.on('error', err => {
 throw err;
 });

 } catch (err) {
 console.error("❌ Error:", err.message || err);
 await api.sendMessage("❌ | Failed to generate art. Please try again later.", event.threadID);
 }
 }
};