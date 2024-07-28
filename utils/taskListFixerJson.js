const { schema } = require("../schema");

const processContent = (contentArray) => {
  return contentArray.map((item) => {
    if (typeof item === "object") {
      if (item.type === "steps") {
        item.type = "ul";
        item.content.forEach((step) => {
          if (typeof step === "object") {
            step.type = "li";
            step.content = [...step.content[0].content];
          }
        });
      } else if (item.type === "step") {
        item.type = "li";
        item.content = [...item.content[0].content];
      }
    }
    return item;
  });
};

// function to remove unwanted elements from the dom json
function taskListFixerJson(
  json /*any tag details as a dom json*/,
  parentDetails /*details of immediate parent of any tag*/,
  parentDivClass
) {
  if (typeof json === "object" && json !== null) {
    const type = json.type;

    let currentDivClass;

    // replace or remove switch case based on schema and custom condition as per project requirements
    switch (type) {
      case "postreq":
        json.content.forEach((ele) => {
          if (ele.type === "ol") {
            ele.content = ele.content.map((subEle) => {
              if (subEle.type === "step") {
                subEle.type = "li";
                subEle.content = [...subEle.content[0].content];
                subEle.content = processContent(subEle.content);
              }
              return subEle;
            });
          }

          if (ele.type === "steps") {
            ele.type = "ul";
            ele.content.forEach((step) => {
              if (typeof step === "object") {
                step.type = "li";
                step.content = [...step.content[0].content];
              }
            });
          }
        });
        break;
      default:
        break;
    }

    if (schema[json.type]) {
      if (Array.isArray(json.content)) {
        json.content = json.content.map((ele) =>
          taskListFixerJson(
            ele,
            json.type ? json : parentDetails,
            currentDivClass
          )
        );
      } else if (Array.isArray(json.content)) {
        json.type = "";
        delete json.attributes;
        json.content.map((ele) =>
          taskListFixerJson(
            ele,
            json.type ? json : parentDetails,
            currentDivClass
          )
        );
      }
      return json;
    } else if (Array.isArray(json.content)) {
      json.type = "";
      delete json.attributes;
      json.content.map((ele) =>
        taskListFixerJson(
          ele,
          json.type ? json : parentDetails,
          currentDivClass
        )
      );
    } else if (!json.content) {
      json.type = "";
      delete json.attributes;
      return json;
    }
  }
  return json;
}

module.exports = taskListFixerJson;
