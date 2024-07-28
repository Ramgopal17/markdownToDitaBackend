const { DOMParser, XMLSerializer } = require("xmldom");

function outerBodyTagRemover(xmlString) {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlString, "text/xml");

  const outerBody = xmlDoc.getElementsByTagName("body")[0];

  const parent = outerBody.parentNode;

  while (outerBody.firstChild) {
    parent.insertBefore(outerBody.firstChild, outerBody);
  }

  parent.removeChild(outerBody);

  const serializer = new XMLSerializer();
  const newXmlString = serializer.serializeToString(xmlDoc);

  return newXmlString;
}

module.exports = outerBodyTagRemover;
