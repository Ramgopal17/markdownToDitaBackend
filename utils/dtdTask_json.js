const { HTMLToJSON } = require("html-to-json-parser");
const { JSONToHTML } = require("html-to-json-parser");
const { schema } = require("../schema");

let isValidLiandUlOL = false;

async function dtdTaskJson(content) {
  let isModified = { value: false };
  isValidLiandUlOL = false;
  let json = await HTMLToJSON(content, false);

  let result = removeUnwantedElementsForTask(json, {}, "", isModified);

  let htmlContent = await JSONToHTML(result);

  return { content: htmlContent, boolValue: isModified };
}

function removeUnwantedElementsForTask(
  json,
  parentDetails,
  parentDivClass,
  isModified
) {
  if (typeof json === "object" && json !== null) {
    const type = json.type;

    let currentDivClass;

    const expectedTypes = ["p", "p", ["ul", "ol"]];

    if (json.type === "topic") {
      const objectsOnly = json.content[1].content.filter(
        (item) => typeof item === "object"
      );

      const match = objectsOnly.slice(0, 3).every((obj, index) => {
        if (index === 2 && Array.isArray(expectedTypes[index])) {
          return expectedTypes[index].includes(obj.type);
        } else {
          return obj.type === expectedTypes[index];
        }
      });

      isValidLiandUlOL = match;
    }

    if (isValidLiandUlOL) {
      isModified.value = true;
      switch (type) {
        case "topic":
          let firstP = [];

          const objectsOnly = json.content[1].content.filter(
            (item) => typeof item === "object"
          );

          if (json.content[1].type === "body") {
            firstP.push(objectsOnly[0]);
          }
          firstP[0].type = "shortdesc";
          json.content.splice(1, 0, firstP[0]);

          json.type = "task";

          break;
        case "body":
          json.content = json.content.filter(
            (item) => typeof item === "object"
          );

          let poOFShortDesc = "";
          json.type = "taskbody";
          json.content.forEach((ele, index) => {
            if (ele.type === "shortdesc") {
              poOFShortDesc = index;
            }
          });

          json.content.splice(poOFShortDesc, 1);
          isModified = true;

          const newContent = {
            type: "postreq",
            content: [],
          };

          if (json.content.length > 2) {
            json.content.forEach((ele, index) => {
              if (index !== 0 && index !== 1) {
                newContent.content.push(ele);
              }
            });

            json.content.splice(2);

            let hhh = cleanJSON(newContent);
            json.content.push(filterObjectsWithBlankQuotes(hhh));
          }

          json.content[0].type = "context";
          break;

        case "ul":
          json.type = "steps";

          break;
        case "ol":
          json.type = "steps";
          break;

        case "li":
          let cmdObject = {
            type: "cmd",
            content: [],
          };

          json.type = "step";
          json.attributes = {};

          cmdObject.content.push(json.content[0]);
          json.content = [];
          json.content = [cmdObject];

          break;
      }
      if (schema[json.type]) {
        if (Array.isArray(json.content)) {
          json.content = json.content.map((ele) =>
            removeUnwantedElementsForTask(
              ele,
              json.type ? json : parentDetails,
              currentDivClass,
              isModified
            )
          );
        } else if (Array.isArray(json.content)) {
          json.type = "";
          delete json.attributes;
          json.content.map((ele) =>
            removeUnwantedElementsForTask(
              ele,
              json.type ? json : parentDetails,
              currentDivClass,
              isModified
            )
          );
        }
        return json;
      } else if (Array.isArray(json.content)) {
        json.type = "";
        delete json.attributes;
        json.content.map((ele) =>
          removeUnwantedElementsForTask(
            ele,
            json.type ? json : parentDetails,
            currentDivClass,
            isModified
          )
        );
      } else if (!json.content) {
        json.type = "";
        delete json.attributes;
        return json;
      }
    }
  }

  return json;
}

module.exports = dtdTaskJson;
function cleanJSON(json) {
  if (typeof json === "string") {
    return json.replace(/\n/g, "");
  } else if (Array.isArray(json)) {
    return json.filter((item) => item !== "").map((item) => cleanJSON(item));
  } else if (typeof json === "object") {
    const cleanedObject = {};
    for (let key in json) {
      if (json[key] !== "") {
        cleanedObject[key] = cleanJSON(json[key]);
      }
    }
    return cleanedObject;
  }
  return json;
}
function filterObjectsWithBlankQuotes(objData) {
  if (typeof objData !== "object" || objData === null) {
    return objData;
  }

  if (Array.isArray(objData)) {
    return objData
      .map(filterObjectsWithBlankQuotes)
      .filter((item) => item !== "");
  }

  const newObj = {};
  for (const key in objData) {
    if (Object.hasOwnProperty.call(objData, key)) {
      const value = filterObjectsWithBlankQuotes(objData[key]);
      if (value !== "") {
        newObj[key] = value;
      }
    }
  }
  return newObj;
}
