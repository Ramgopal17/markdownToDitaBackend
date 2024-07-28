const generateRandomId = require("../utils/generateRandomId");

const addTopicTag = (md, firstHeadingSkippedVlaue) => {
  let insideTopic = false;
  let firstHeadingSkipped = firstHeadingSkippedVlaue;

  // Customize rendering to add <topic> tag before each heading
  md.renderer.rules.heading_open = function (tokens, idx, options, env, self) {
    if (!firstHeadingSkipped) {
      firstHeadingSkipped = true;

      return self.renderToken(tokens, idx, options);
    }

    if (!insideTopic) {
      insideTopic = true;
      return (
        `<topic id="t${generateRandomId(6)}">\n` +
        self.renderToken(tokens, idx, options)
      );
    }

    return (
      `</topic>\n<topic id="t${generateRandomId(6)}">\n` +
      self.renderToken(tokens, idx, options)
    );
  };

  // Customize rendering to close </topic> tag after each heading
  md.renderer.rules.heading_close = function (tokens, idx, options, env, self) {
    const nextToken = tokens[idx + 1];
    if (insideTopic && nextToken && nextToken.type === "heading_open") {
      insideTopic = false;
      return self.renderToken(tokens, idx, options) + "</topic>\n";
    }
    return self.renderToken(tokens, idx, options);
  };
};

module.exports = addTopicTag;

// const generateRandomId = require("../utils/generateRandomId");

// const addTopicTag = (md, firstHeadingSkippedValue) => {
//   let insideTopic = false;
//   let currentLevel = 0;
//   let firstHeadingSkipped = firstHeadingSkippedValue;

//   // Customize rendering to add <topic> tag before each heading
//   md.renderer.rules.heading_open = function (tokens, idx, options, env, self) {
//     const headingToken = tokens[idx];
//     const level = parseInt(headingToken.tag.substr(1));

//     if (!firstHeadingSkipped) {
//       firstHeadingSkipped = true;
//       return self.renderToken(tokens, idx, options);
//     }

//     let output = "";

//     if (!insideTopic || level <= currentLevel) {
//       if (insideTopic) {
//         output += `</topic>\n`;
//       }
//       insideTopic = true;
//       output += `<topic id="t${generateRandomId(6)}">\n`;
//     }

//     currentLevel = level;

//     return output + self.renderToken(tokens, idx, options);
//   };

//   // Customize rendering to close </topic> tag after each heading
//   md.renderer.rules.heading_close = function (tokens, idx, options, env, self) {
//     const headingToken = tokens[idx];
//     const level = parseInt(headingToken.tag.substr(1));

//     let output = self.renderToken(tokens, idx, options);

//     if (
//       insideTopic &&
//       tokens[idx + 1] &&
//       parseInt(tokens[idx + 1].tag.substr(1)) <= level
//     ) {
//       insideTopic = false;
//       output += "</topic>\n";
//     }

//     return output;
//   };
// };

// module.exports = addTopicTag;
