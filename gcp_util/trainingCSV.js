var fs = require("fs");
const wtj = require("wikipedia-to-json");

function createTrainingCSV(data, topic) {
  csv = "";
  data.forEach((el) => {
    // Delete all return carraiges. Replace " with "" (double quotes).
    let content = el.replace(/[\n\r]/g, "").replace(/(?<!")"/g, '""');

    if (content.length > 0) {
      csv += '"' + content + '","' + topic + '"\r\n';
    }
  });

  return csv;
}

module.exports = createTrainingCSV;
