const fs = require("fs");
const path = require("path");
const { DOMParser } = require("xmldom");
const markdownIt = require("markdown-it");
const md = new markdownIt();
const grayMatter = require("gray-matter");

async function preFlightChecker(inputFolderDir) {
  try {
    const files = await fs.promises.readdir(inputFolderDir);

    const results = [];

    for (const file of files) {
      const filePath = path.join(inputFolderDir, file);
      const stats = await fs.promises.stat(filePath);

      if (stats.isDirectory()) {
        const subDirResults = await preFlightChecker(filePath);
        results.push(...subDirResults);
      } else if (stats.isFile() && file.endsWith(".md")) {
        const result = await checkMDStartsWithHeading(filePath);

        results.push(result);
      }
    }

    return results;
  } catch (error) {
    console.error("Error reading directory:", error);
    throw error;
  }
}

async function checkMDStartsWithHeading(filePath) {
  try {
    const fileData = await fs.promises.readFile(filePath, "utf8");

    const { content, data } = grayMatter(fileData);
    const mdToHtml = md.render(content);

    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(mdToHtml, "text/html");

    const headingTags = ["h1", "h2", "h3", "h4", "h5", "h6"];
    let modifiedFilePath = filePath.split("input").pop();

    for (const tag of headingTags) {
      const tags = xmlDoc.getElementsByTagName(tag);
      if (tags.length > 0) {
        return { filePath: modifiedFilePath, title: true, heading: tag };
      }
    }

    return { filePath: modifiedFilePath, title: false };
  } catch (error) {
    console.error("Error processing file:", error);
    throw error;
  }
}
module.exports = preFlightChecker;
