const { schema } = require("../schema");
const generateRandomId = require("./generateRandomId");

// function for removing unwanted elements from the dom json in Task
function removeUnwantedElements2(
  json /*any tag details as a dom json*/,
  parentDetails /*details of immediate parent of any tag*/,
  parentDivClass
) {
  if (typeof json === "object" && json !== null) {
    const type = json.type;
    let currentDivClass, isTagHandled;

    switch (type) {
      case "body":
        isTagHandled = true;
        json.type = "task";
        json.attributes = {};
        json.attributes.id = "task_" + generateRandomId(6);
        json.attributes["xml:lang"] = "en-us";
        json.content.unshift({
          type: "title",
          content: ["this is auto generated title"],
        });

        break;

      case "p":
        isTagHandled = true;
        json.type = "shortdesc";
        break;

      case "ul":
        isTagHandled = true;
        let taskbodyObj = {
          type: "steps",
          content: [],
        };

        if (json.attributes?.class === "contains-task-list") {
          taskbodyObj.content = json.content;
          json.content = [];
          json.content = [taskbodyObj];

          json.type = "taskbody";
          json.attributes = {};
        }
        break;

      case "li":
        isTagHandled = true;
        let cmdObject = {
          type: "cmd",
          content: [],
        };

        json.type = "step";
        json.attributes = {};

        cmdObject.content.push(json.content[1]);
        json.content = [];
        json.content = [cmdObject];

        break;
    }

    // if (!schema[type] && !isTagHandled) {
    //   //if tag is not in schema or not handled in switch case and neither it is mapped in the database
    //   logData.taskTags.task_missingTags[type] = true;
    // } else {
    //   logData.taskTags.task_handledTags[type] = true;
    // }

    if (schema[json.type]) {
      if (Array.isArray(json.content)) {
        json.content = json.content.map((ele) =>
          removeUnwantedElements2(
            ele,
            json.type ? json : parentDetails,
            currentDivClass
          )
        );
      } else if (Array.isArray(json.content)) {
        json.type = "";
        delete json.attributes;
        json.content.map((ele) =>
          removeUnwantedElements2(
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
        removeUnwantedElements2(
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

module.exports = removeUnwantedElements2;
