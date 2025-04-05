const axios = require('axios');

module.exports = {
  config: {
    name: "prompt",
    aliases: ['p'],
    version: "1.0",
    author: " Team Calyx",
    countDown: 5,
    role: 0,
    description: "Generates a Midjourney prompt based on text or image input.",
    category: "𝗔𝗜",
    guide: {
      en: "   {pn} <text>: Generate a prompt based on the text.\n   {pn} (reply to an image): Generate a prompt based on the replied image.",
     ar: "   {pn} <النص>: قم بإنشاء موجه بناءً على النص.\n   {pn} (الرد على صورة): قم بإنشاء موجه بناءً على الصورة التي تم الرد عليها."
    }
  },
  onStart: async ({ message, event, args }) => {
    try {
      const imageUrl = event.type === "message_reply" && event.messageReply.attachments[0]?.type === 'photo' ? event.messageReply.attachments[0].url : null;
      const promptText = args.join(" ");

      if (!imageUrl && !promptText) return message.reply("Please provide a prompt or reply to an image.");

      const queryParam = imageUrl ? `image=${encodeURIComponent(imageUrl)}` : `prompt=${encodeURIComponent(promptText)}`;
      const response = await axios.get(`https://nova-apis.onrender.com/prompt?${queryParam}`);

      if (response.status === 200) return message.reply(response.data.prompt);
      
    } catch (error) {
      console.error("Error generating prompt:", error);
      message.reply("An error occurred. Please try again later.");
    }
  }
};