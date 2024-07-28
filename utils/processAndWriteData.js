const xmlFormat = require("xml-formatter");
const createDirectory = require("./createDirectory.js");
const { addData } = require("../state/ditaMap.js");
const fixImagePath = require("./fixImagePath.js");
const xrefDataAttribute = require("./xrefDataAttribute.js");
const path = require("path");
const fs = require("fs");
const { capitalizeFirstWord } = require("./helper.js");

function processAndWriteData(
  tc,
  dtdType,
  newPath,
  outputDirName,
  fileInfo,
  filePath
) {
  let fileNameOnTitle = tc.title.replace(/\s+/g, "_").replace(/[^\w\s]/g, "");

  fileNameOnTitle = fileNameOnTitle.replace(/__/g, "_");
  fileNameOnTitle = fileNameOnTitle + ".md";

  let actualPath =
    newPath.split("/").slice(0, -1).join("/") + "/" + fileNameOnTitle;

  let outputFilePath = "";

  if (actualPath.startsWith("/")) {
    actualPath = actualPath.slice(1);
  }

  if (actualPath.endsWith(".md")) {
    // Replace ".md" with ".dita"
    outputFilePath = `${outputDirName}${actualPath.replace(/\.md$/, ".dita")}`;
  } else if (actualPath.endsWith(".mdx")) {
    // Replace ".mdx" with ".dita"
    outputFilePath = `${outputDirName}${actualPath.replace(/\.mdx$/, ".dita")}`;
  }

  const outputDir = path.dirname(outputFilePath);

  createDirectory(outputDirName);
  createDirectory(outputDir.toLowerCase());

  fileInfo.nestObj.unshift({
    title: tc.title,
    level: tc.level,
    path: outputFilePath,
    child: [],
  });

  xrefDataAttribute(tc.content, filePath, outputFilePath);
  let newfixImagePath = fixImagePath(tc.content, outputFilePath);

  fs.writeFileSync(
    outputFilePath.toLowerCase(),
    xmlFormat(
      `<?xml version="1.0" encoding="UTF-8"?>\n 
                                <!DOCTYPE ${dtdType} PUBLIC "-//OASIS//DTD DITA ${capitalizeFirstWord(
        dtdType
      )}//EN" "${dtdType}.dtd">
                                ` + newfixImagePath,
      {
        indentation: "  ",
        filter: (node) => node.type !== "Comment",
        collapseContent: true,
        lineSeparator: "\n",
      }
    ),
    "utf-8"
  );

  addData(fileInfo);
}

module.exports = processAndWriteData;
