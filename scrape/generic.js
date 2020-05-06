const cheerio = require("cheerio");
const axios = require("axios");
const fs = require("fs");
const path = require("path");

const scrape = async (url) => {
  let html = null;
  await axios({
    method: "get",
    url,
  })
    .then((response) => (html = response))
    .catch((err) => console.log(err));

  const $ = cheerio.load(html.data);
  var data = [];
  $("p,h1,h2,h3").map((i, el) => {
    // cheerio ref: http://zetcode.com/javascript/cheerio/
    if ($(el).text()) data.push($(el).text());
  });

  // fs.writeFile(
  //   path.join(__dirname, "../training-data", "youtube.txt"),
  //   data,
  //   (err) => {
  //     if (err) throw err;
  //     console.log("wrote to file");
  //   }
  // );
  return data;
};

// scrape("http://www.test.com/");
// scrape("https://www.youtube.com/watch?v=XlqP7lbr3gY&t=327s");
// scrape("https://www.reddit.com/");
// scrape(
//   "https://www.reddit.com/r/nosleep/comments/f8afkj/nosleep_has_been_hiding_a_terrible_secret_and_i/"
// );

module.exports = scrape;
