// const { DOMParser, XMLSerializer } = require("xmldom");

// function fileSeparator(xmlString) {
//   const parser = new DOMParser();
//   const xmlDoc = parser.parseFromString(xmlString, "text/xml");

//   const serializer = new XMLSerializer();
//   const topicsArray = [];

//   const processedTopics = new Set(); // Set to keep track of processed topics

//   const findNestedTopics = (node) => {
//     if (node.nodeName === "topic" && !processedTopics.has(node)) {
//       const topicClone = node.cloneNode(true);
//       const serializedTopic = serializer.serializeToString(topicClone);
//       const titleElement = Array.from(node.childNodes).find(
//         (child) => child.nodeName === "title"
//       );
//       const title = titleElement ? titleElement.textContent : "";
//       topicsArray.push({ topic: serializedTopic, title });
//       processedTopics.add(node);
//       const childTopics = node.getElementsByTagName("topic");
//       for (let i = 0; i < childTopics.length; i++) {
//         findNestedTopics(childTopics[i]);
//       }
//     }
//   };

//   findNestedTopics(xmlDoc.documentElement);

//   return topicsArray;
// }

// module.exports = fileSeparator;

// const { DOMParser, XMLSerializer } = require("xmldom");

// function fileSeparator(xmlString) {
//   const parser = new DOMParser();
//   const xmlDoc = parser.parseFromString(xmlString, "text/xml");

//   const serializer = new XMLSerializer();

//   const createTopicObject = (node) => {
//     const topicObject = {};
//     const titleElement = Array.from(node.childNodes).find(
//       (child) => child.nodeName === "title"
//     );
//     topicObject.title = titleElement ? titleElement.textContent : "";
//     topicObject.topic = serializer.serializeToString(node.cloneNode(true));
//     topicObject.children = [];
//     const childTopics = node.getElementsByTagName("topic");
//     for (let i = 0; i < childTopics.length; i++) {
//       const childTopicObject = createTopicObject(childTopics[i]);
//       topicObject.children.push(childTopicObject);
//     }
//     return topicObject;
//   };

//   const topLevelTopic = xmlDoc.documentElement;
//   const topicsArray = [createTopicObject(topLevelTopic)];

//   return topicsArray;
// }

// module.exports = fileSeparator;

// const { DOMParser, XMLSerializer } = require("xmldom");

// function fileSeparator(xmlString) {
//     const parser = new DOMParser();
//     const xmlDoc = parser.parseFromString(xmlString, "text/xml");

//     const topics = xmlDoc.getElementsByTagName("topic");
//     const result = [];

//     for (let i = 0; i < topics.length; i++) {
//         const topic = topics[i];
//         const title = topic.getElementsByTagName("title")[0];
//         const body = topic.getElementsByTagName("body")[0];

//         const topicTitle = title ? new XMLSerializer().serializeToString(title) : '';
//         const topicBody = body ? new XMLSerializer().serializeToString(body) : '';

//         result.push({ topicTitle, topicBody });
//     }

//     return result;
// }

// module.exports = fileSeparator;

function fileSeparator(xmlString) {
  const topics = [];
  let index = xmlString.lastIndexOf("<topic id=");

  while (index !== -1) {
    const endTopicIndex =
      xmlString.indexOf("</topic>", index) + "</topic>".length;
    let topicContent = xmlString.substring(index, endTopicIndex);

    topics.push({
      content: topicContent,
      title: extractTitle(topicContent).title,
      level: extractTitle(topicContent).outputclass.split("h")[1],
    });

    xmlString =
      xmlString.substring(0, index) + xmlString.substring(endTopicIndex);
    index = xmlString.lastIndexOf("<topic id=");
  }

  return topics;
}

function extractTitle(topic) {
  const titleStartIndex = topic.indexOf("<title");
  const titleEndIndex = topic.indexOf("</title>", titleStartIndex);
  const titleContent = topic.substring(
    titleStartIndex,
    titleEndIndex + "</title>".length
  );

  // Extracting the title text
  const titleText = titleContent.replace(/<\/?[^>]+(>|$)/g, "");

  // Extracting the outputclass attribute value
  const outputclassMatch = titleContent.match(/outputclass="([^"]+)"/);
  const outputclass = outputclassMatch ? outputclassMatch[1] : "";

  return { title: titleText.trim(), outputclass: outputclass };
}

module.exports = fileSeparator;
