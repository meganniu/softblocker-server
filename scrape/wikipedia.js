const fs = require("fs");
const url = require("url");
const path = require("path");

const wtj = require("wikipedia-to-json");

const getWikipediaData = async (topic) => {
  const elements = await wtj.fetchArticleElements(topic);

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

// scrape("Glass");

module.exports = { getWikipediaText, scrape };
