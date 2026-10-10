import axios from "axios";

const captions = [
  "ღ••\n– কোনো নেতার পিছনে নয়.!!🤸‍♂️\n– মসজিদের ইমামের পিছনে দাড়াও জীবন বদলে যাবে ইনশাআল্লাহ.!!🖤🌻\n۵",
  "-!\n__আল্লাহর রহমত থেকে নিরাশ হওয়া যাবে না!” আল্লাহ অবশ্যই তোমাকে ক্ষমা করে দিবেন☺️🌻\nসুরা যুমাহ্ আয়াত ৫২..৫৩💙🌸\n-!",
  "- ইসলাম অহংকার করতে শেখায় না!🌸\n\n- ইসলাম শুকরিয়া আদায় করতে শেখায়!🤲🕋🥀",
  "- বেপর্দা নারী যদি নায়িকা হতে পারে\n _____🤗🥀 -তবে পর্দাশীল নারী গুলো সব ইসলামের শাহাজাদী __🌺🥰\n  __মাশাল্লাহ।।",
  "┏━━━━ ﷽ ━━━━┓\n 🖤﷽স্মার্ট নয় ইসলামিক ﷽🥰\n 🖤﷽ জীবন সঙ্গি খুঁজুন ﷽🥰\n┗━━━━ ﷽ ━━━━┛",
  "ღ࿐– যখন বান্দার জ্বর হয়,😇\n🖤তখন গুনাহ গুলো ঝড়ে পড়তে থাকে☺️\n– হযরত মুহাম্মদ(সাঃ)●───༊༆",
  "~🍂🦋\n              ━𝐇𝐚𝐩𝐩𝐢𝐧𝐞𝐬𝐬 𝐈𝐬 𝐄𝐧𝐣𝐨𝐲𝐢𝐧𝐠 𝐓𝐡𝐞 𝐋𝐢𝐭𝐭𝐥𝐞\n                          ━𝐓𝐡𝐢𝐧𝐠𝐬 𝐈𝐧 𝐋𝐢𝐟𝐞..♡🌸\n           ━𝐀𝐥𝐡𝐚𝐦𝐝𝐮𝐥𝐢𝐥𝐥𝐚𝐡 𝐅𝐨𝐫 𝐄𝐯𝐞𝐫𝐲𝐭𝐡𝐢𝐧𝐠...💗🥰",
  "•___💜🌈___•\n°___:))-তুমি আসক্ত হও-||-🖤🌸✨\n°___:))-তবে নেশায় নয় আল্লাহর ইবাদতে-||-🖤🌸✨\n•___🍒🖇️✨___•",
  "─❝হাসতে❜❜ হাসতে❜❜ একদিন❜❜😊😊\n ━❥❝সবাইকে❜❜ ─❝কাদিয়ে ❜❜বিদায়❜❜ নিবো❜❞.!!🙂💔🥀 ",
  "🦋🥀࿐\nლ_༎হাজারো༎স্বপ্নের༎শেষ༎স্থান༎••༊🙂🤲🥀\n♡_༎কবরস্থান༎_♡❤\n🦋🥀࿐",
  "•\n\nপ্রসঙ্গ যখন ধর্ম নিয়ে•🥰😊\nতখন আমাদের ইসলামই সেরা•❤️\n𝐀𝐥𝐡𝐚𝐦𝐝𝐮𝐥i𝐥𝐥𝐚🌸❤️",
  "🥀😒কেউ পছন্দ না করলে,,,,\n        কি যায় আসে,,🙂\n                😇আল্লাহ তো,,\n        পছন্দ করেই বানিয়েছে,,♥️🥀\n         🥰  Alhamdulillah 🕋",
  "🌼 এত অহংকার করে লাভ নেই! 🌺 \n  মৃত্যুটা নিশ্চিত,, শুধু সময়টা\n   অ'নিশ্চিত।🖤🙂 ",
  "_🌻••ছিঁড়ে ফেলুন অতীতের\nসকল পাপের\n                 অধ্যায় ।\n_ফিরে আসুন রবের ভালোবাসায়••🖤🥀",
  "_বুকে হাজারো কষ্ট নিয়ে\n                  আলহামদুলিল্লাহ বলাটা••!☺️\n_আল্লাহর প্রতি অগাধ বিশ্বাসের নমুনা❤️🥀",
  "_আল্লাহর ভালোবাসা পেতে চাও•••!🤗\n\n_তবে রাসুল (সা:)কে অনুসরণ করো••!🥰   ",
];

const images = [
  "https://i.postimg.cc/7LdGnyjQ/images-31.jpg",
  "https://i.postimg.cc/65c81ZDZ/images-30.jpg",
  "https://i.postimg.cc/Y0wvTzr6/images-29.jpg",
  "https://i.postimg.cc/1Rpnw2BJ/images-28.jpg",
  "https://i.postimg.cc/mgrPxDs5/images-27.jpg",
  "https://i.postimg.cc/yxXDK3xw/images-26.jpg",
  "https://i.postimg.cc/kXqVcsh9/muslim-boy-having-worship-praying-fasting-eid-islamic-culture-mosque-73899-1334.webp",
  "https://i.postimg.cc/hGzhj5h8/muslims-reading-from-quran-53876-20958.webp",
  "https://i.postimg.cc/x1Fc92jT/blue-mosque-istanbul-1157-8841.webp",
  "https://i.postimg.cc/j5y56nHL/muhammad-ali-pasha-cairo-219717-5352.webp",
  "https://i.postimg.cc/dVWyHfhr/images-1-21.jpg",
  "https://i.postimg.cc/q7MGgn3X/images-1-22.jpg",
  "https://i.postimg.cc/sX5CXtSh/images-1-16.jpg",
  "https://i.postimg.cc/66Rp2Pwz/images-1-17.jpg",
  "https://i.postimg.cc/Qtzh9pY2/images-1-18.jpg",
  "https://i.postimg.cc/MGrhdz0R/images-1-19.jpg",
  "https://i.postimg.cc/LsMSj9Ts/images-1-20.jpg",
  "https://i.postimg.cc/KzNXyttX/images-1-13.jpg",
];

async function onCall({ message, data }) {
  const { senderID, body } = message;
  if (!body || senderID == global.botID) return;

  const prefix = data?.thread?.data?.prefix || global.config?.PREFIX || "/";
  if (body.trim() !== prefix) return;

  const randomCaption = captions[Math.floor(Math.random() * captions.length)];
  const randomImage = images[Math.floor(Math.random() * images.length)];

  try {
    const r = await axios.get(randomImage, { responseType: "stream", timeout: 30000 });
    return message.reply({
      body: `╭────────────❍\n╰➤ 🕌『 𝐈𝐒𝐋𝐀𝐌𝐈𝐂 𝐐𝐔𝐎𝐓𝐄 』\n\n${randomCaption}\n╰─────────────────➤`,
      attachment: r.data
    });
  } catch (e) {
    return message.reply(
      `╭────────────❍\n╰➤ 🕌『 𝐈𝐒𝐋𝐀𝐌𝐈𝐂 𝐐𝐔𝐎𝐓𝐄 』\n\n${randomCaption}\n╰─────────────────➤`
    );
  }
}

export default {
  onCall
};
