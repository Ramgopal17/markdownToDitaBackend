const { schema } = require("../schema");
const { addMissingTags, addHandledTags } = require("../state/logData");

const validateURL = require("./validateURL");

// function to remove unwanted elements from the dom json
function removeUnwantedElements(
  json /*any tag details as a dom json*/,
  parentDetails /*details of immediate parent of any tag*/,
  parentDivClass
) {
  if (typeof json === "object" && json !== null) {
    const type = json.type;
    let isTagHandled;

    let currentDivClass;

    // replace or remove switch case based on schema and custom condition as per project requirements
    switch (type) {
      case "p":
        isTagHandled = true;
        if (json.content !== undefined) {
          if (parentDetails.type === "p") {
            json.attributes = parentDetails.attributes
              ? { ...parentDetails.attributes }
              : {};
            json.attributes.class =
              (json.attributes.class || "") + ` ${parentDivClass}`;
            json.attributes.class = json.attributes.class.trim();
            parentDetails.type = "";
            delete parentDetails.attributes;
          }
          if (parentDivClass) {
            // fs.writeFileSync("bug.text",""+bugCount++,"utf-8")
            json.attributes = {};
            json.attributes.class =
              (json.attributes?.class || "") + ` ${parentDivClass}`;
            json.attributes.class = json.attributes.class.trim();
          }

          if (json.content[0].type === "img") {
            json.type = "fig";
          }
          break;
        }
      case "div":
        isTagHandled = true;
        currentDivClass = json.attributes?.class
          ? json.attributes?.class
          : parentDivClass;
        if (schema.noteType.includes(json.attributes?.class)) {
          let mainCOntent = json.content[1].content;
          delete json.content;
          json.content = mainCOntent;

          let attra = json.attributes;
          json.type = "note";

          attra["type"] = json.attributes?.class;
          delete json.attributes["class"];
          break;
        }
        json.type = "";
        delete json.attributes;
        break;
      case "html":
        isTagHandled = true;
        json.type = "topic";
        break;
      case "h1":
        isTagHandled = true;
        if (json.attributes === undefined) {
          json["attributes"] = {
            class: "- topic/title ",
          };
        } else {
          json.attributes["class"] = "- topic/title ";
        }

        json.type = "title";
        let hasKeyattrh1 = "attributes" in json;
        if (!hasKeyattrh1) {
          json["attributes"] = {};
        }
        let attrtitleh1 = json.attributes;
        attrtitleh1["outputclass"] = "h1";
        break;
      case "h2":
        isTagHandled = true;
        if (json.attributes === undefined) {
          json["attributes"] = {
            class: "- topic/title ",
          };
        } else {
          json.attributes["class"] = "- topic/title ";
        }
        json.type = "title";
        let hasKeyattrh2 = "attributes" in json;
        if (!hasKeyattrh2) {
          json["attributes"] = {};
        }
        let attrtitleh2 = json.attributes;
        attrtitleh2["outputclass"] = "h2";
        break;
      case "h3":
        isTagHandled = true;
        if (json.attributes === undefined) {
          json["attributes"] = {
            class: "- topic/title ",
          };
        } else {
          json.attributes["class"] = "- topic/title ";
        }
        json.type = "title";
        let hasKeyattrh3 = "attributes" in json;
        if (!hasKeyattrh3) {
          json["attributes"] = {};
        }
        let attrtitleh3 = json.attributes;
        attrtitleh3["outputclass"] = "h3";
        break;
      case "h4":
        isTagHandled = true;
        if (json.attributes === undefined) {
          json["attributes"] = {
            class: "- topic/title ",
          };
        } else {
          json.attributes["class"] = "- topic/title ";
        }
        json.type = "title";
        let hasKeyattrh4 = "attributes" in json;
        if (!hasKeyattrh4) {
          json["attributes"] = {};
        }
        let attrtitleh4 = json.attributes;
        attrtitleh4["outputclass"] = "h4";
        break;
      case "h5":
        isTagHandled = true;
        if (json.attributes === undefined) {
          json["attributes"] = {
            class: "- topic/title ",
          };
        } else {
          json.attributes["class"] = "- topic/title ";
        }
        json.type = "title";
        let hasKeyattrh5 = "attributes" in json;
        if (!hasKeyattrh5) {
          json["attributes"] = {};
        }
        let attrtitleh5 = json.attributes;
        attrtitleh5["outputclass"] = "h5";
        break;
      case "h6":
        isTagHandled = true;
        if (json.attributes === undefined) {
          json["attributes"] = {
            class: "- topic/title ",
          };
        } else {
          json.attributes["class"] = "- topic/title ";
        }
        json.type = "title";
        let hasKeyattrh6 = "attributes" in json;
        if (!hasKeyattrh6) {
          json["attributes"] = {};
        }
        let attrtitleh6 = json.attributes;
        attrtitleh6["outputclass"] = "h6";
        break;
      case "a":
        isTagHandled = true;
        json.type = "xref";
        let attra = json.attributes;

        if (attra["data-linktype"]) attra["scope"] = attra["data-linktype"];
        else if (validateURL(json.attributes.href)) {
          attra["scope"] = "external";
          attra["format"] = "html";
        }

        delete attra["data-linktype"];
        delete attra["target"];
        break;
      case "strong":
        isTagHandled = true;
        json.type = "b";
        break;
      case "colgroup":
        isTagHandled = true;
        json.type = "tgroup";
        break;
      case "col":
        isTagHandled = true;
        json.type = "colspec";
        break;
      case "tr":
        isTagHandled = true;
        json.type = "row";
        break;
      case "td":
        isTagHandled = true;

        let hastdAttr = "attributes" in json;

        if (!hastdAttr) {
          json["attributes"] = {};
          json.attributes["align"] = "center";
        } else if (hastdAttr) {
          let tdAttr = json.attributes;
          let tdAlignType = tdAttr.style;
          tdAlignType = tdAlignType.split(":")[1];
          if (tdAlignType === "right") {
            tdAttr["align"] = "right";
          } else if (tdAlignType === "left") {
            tdAttr["align"] = "left";
          } else {
            tdAttr["align"] = "center";
          }
        }
        delete json.attributes?.style;
        json.type = "entry";
        break;
      case "th":
        isTagHandled = true;
        let hasthAttr = "attributes" in json;

        if (!hasthAttr) {
          json["attributes"] = {};
          json.attributes["align"] = "center";
        } else if (hasthAttr) {
          let thAttr = json.attributes;
          let thAlignType = thAttr.style;
          thAlignType = thAlignType.split(":")[1];
          if (thAlignType === "right") {
            thAttr["align"] = "right";
          } else if (thAlignType === "left") {
            thAttr["align"] = "left";
          } else {
            thAttr["align"] = "center";
          }
        }
        delete json.attributes?.style;
        json.type = "entry";
        break;
      case "img":
        isTagHandled = true;
        json.type = "image";
        let attr = json.attributes;
        attr["href"] = attr["src"];
        delete attr["src"];

        break;
      case "blockquote":
        isTagHandled = true;
        json.type = "lq";
        break;

      case "code":
        isTagHandled = true;
        if (json.attributes) {
          delete json.attributes.class;
          delete json.attributes.classname;
        }
        json.type = "codeph";
        break;
      case "strong":
        isTagHandled = true;
        json.type = "b";
        break;
      case "em":
        isTagHandled = true;
        json.type = "i";
        break;
      case "mark":
        isTagHandled = true;
        json.type = "keyword";
        break;
      case "ol":
        isTagHandled = true;
        if (json.attributes) {
          delete json.attributes;
        }
        break;
      case "dl":
        isTagHandled = true;
        const dlEntries = [];
        for (let i = 0; i < json.content.length; i++) {
          const item = json.content[i];
          if (item.type === "dt") {
            const dlEntry = {
              type: "dlentry",
              content: [
                {
                  type: "dt",
                  content: [item.content[0]],
                },
              ],
            };
            dlEntries.push(dlEntry);
          } else if (item.type === "dd") {
            const lastEntry = dlEntries[dlEntries.length - 1];
            lastEntry.content.push({
              type: "dd",
              content: [item.content[0]],
            });
          }
        }

        const dlJSON = {
          type: "dl",
          content: dlEntries,
        };

        json = dlJSON;
        break;

      case "video":
        isTagHandled = true;
        json = {};
        break;

      case "br":
        isTagHandled = true;
        json = {};
        break;

      default:
        break;
    }

    if (!schema[type] && !isTagHandled) {
      //if tag is not in schema or not handled in switch case and neither it is mapped in the database
      // missingTags[type] = true;
      addMissingTags(type, true);
    } else {
      // handledTags[type] = true;
      addHandledTags(type, true);
    }
    if (schema[json.type]) {
      if (Array.isArray(json.content)) {
        json.content = json.content.map((ele) =>
          removeUnwantedElements(
            ele,
            json.type ? json : parentDetails,
            currentDivClass
          )
        );
      } else if (Array.isArray(json.content)) {
        json.type = "";
        delete json.attributes;
        json.content.map((ele) =>
          removeUnwantedElements(
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
        removeUnwantedElements(
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

module.exports = removeUnwantedElements;
