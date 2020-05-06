const url = require("url");
const youtube = require("./youtube");
const generic = require("./generic");
const wikipedia = require("./wikipedia")

const scrape = async (url, forTrainingData) => {
  const urlParsed = URL(url);
  let data = null;
  switch (urlParsed.hostname) {
    case "youtube":
      data = youtube.scrape(url);
      break;
    case "wikipedia":
      data = wikipedia.scrape(url);
      break;
    default:
      data = generic.scrape(url);
  }

  if (forTrainingData === false) {
    return data.reduce((el) => {
      (res, el) => {
        res += el + " ";
        return res;
      };
    }, "");
  }

  return data;
};

module.exports = scrape;
