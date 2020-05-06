const url = require("url");
const scrapeYoutube = require("./youtube");
const scrapeGeneric = require("./generic");
const scrapeWikipedia = require("./wikipedia");

const scrape = async (pageURL, forTrainingData) => {
  const urlParsed = new URL(pageURL);
  let data = null;

  switch (urlParsed.hostname) {
    case "www.youtube.com":
      data = await scrapeYoutube(pageURL);
      break;
    case "www.wikipedia.com":
      data = await scrapeWikipedia(pageURL);
      break;
    default:
      data = await scrapeGeneric(pageURL);
  }

  if (forTrainingData === false) {
    return data.reduce((res, el) => {
      res += el + " ";
      return res;
    }, "");
  }

  return data;
};

module.exports = scrape;
