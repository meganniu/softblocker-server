const fs = require("fs");
const url = require("url");
const path = require("path");

const wikiParser = require("./wikipedia-utils/WikipediaParser");

const getWikipediaData = async (topic) => {
  const elements = await wikiParser.fetchArticleElements(topic);

  const ret = elements.reduce((res, el) => {
    if (el.type === "PARAGRAPH" && el.text) res.push(el.text);
    return res;
  }, []);

  return ret;
};

const scrape = async (wikiURL) => {
  const parsedURL = new URL(wikiURL);

  return getWikipediaData(path.basename(parsedURL.pathname));
};


// const test = async () => {
//   console.log(await scrape("https://en.wikipedia.org/wiki/Glass"));
// }

// test();

module.exports = { getWikipediaData, scrape };
