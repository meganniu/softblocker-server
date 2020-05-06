const url = require("url");
const axios = require("axios");

// Get title, description, and subtitiles.
const scrape = async (videoURL) => {
  const parsedURL = new URL(videoURL);
  const youtubeAPIURL = new URL("https://www.googleapis.com/youtube/v3/videos");

  youtubeAPIURL.searchParams.append("id", parsedURL.searchParams.get("v"));
  youtubeAPIURL.searchParams.append("part", "snippet");
  youtubeAPIURL.searchParams.append("key", process.env.GOOGLE_API_KEY);
  // console.log(youtubeAPIURL.toString());
  // console.log(youtubeAPIURL.toString());
  let data = null;
  await axios({
    method: "get",
    url: youtubeAPIURL.toString(),
  })
    .then((response) => {
      // console.log(response.data.items[0]);
      data = response.data.items[0];
    })
    .catch((err) => {
      if (err) console.log(err);
    });

  let ret = [];
  if (data) {
    data.snippet.tags.forEach((el) => {
      ret.push(el);
    });
    ret.push(`${data.snippet.title}`);
    ret.push(`${data.snippet.description} `);
  }
  // console.log(data.snippet.tags);
  // console.log(JSON.parse(data.snippet.tags));
  // console.log(ret);
  return ret;
};

// scrape("https://www.youtube.com/watch?v=1e7gy3fsJa8");

module.exports = scrape;
