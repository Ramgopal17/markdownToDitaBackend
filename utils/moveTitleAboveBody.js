const { DOMParser, XMLSerializer } = require("xmldom");
const generateRandomId = require("./generateRandomId");

// Function to move the title tag above the body tag
function moveTitleAboveBody(xmlString) {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlString, "text/xml");

  const titles = xmlDoc.getElementsByTagName("title");

  // Check if the first title is found within the body
  const topic = xmlDoc.getElementsByTagName("topic")[0];
  const title = titles[0];
  if (
    titles.length > 0 &&
    titles[0].parentNode.tagName.toLowerCase() === "body"
  ) {
    topic.insertBefore(title, topic.firstChild);
  }
  // Add the title as id to the topic tag
  if (titles.length > 0) {
    topic.setAttribute("id", "p" + generateRandomId(6));
  } else {
    topic?.setAttribute("id", generateRandomId(6));
  }

  return new XMLSerializer().serializeToString(xmlDoc);
}

module.exports = moveTitleAboveBody;
