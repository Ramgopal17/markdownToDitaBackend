const removeUnwantedElements2 = require("./removeUnwantedElements2");
const { HTMLToJSON } = require("html-to-json-parser");
const { JSONToHTML } = require("html-to-json-parser");
const characterToEntity = require("./characterToEntity");
const generateRandomId = require("./generateRandomId");
const xmlFormat = require("xml-formatter");

const fs = require("fs");
const path = require("path");
const createDirectory = require("./createDirectory");
const { addTask } = require("../state/ditaMap");

const outputDirName = "./output/";

// Function to create a task file
function taskFileMaker(filePath, data) {
  return new Promise((resolve, reject) => {
    // removing unwanted elements
    data = removeUnwantedElements2(
      data,
      {} /*parent tag details*/,
      "" /*parent div class*/
    );

    JSONToHTML(data)
      .then(async (res) => {
        try {
          // Replace <> and </> tags
          const cleanedUpContent = res.replace(/<\/*>/g, "");
          const cleanedUpJson = await HTMLToJSON(cleanedUpContent, false);
          //logic for wrapping plain text inside paragraph tags
          if (Array.isArray(cleanedUpJson.content)) {
            cleanedUpJson.content.forEach((ele) => {
              if (ele.type === "body" && Array.isArray(ele.content)) {
                ele.content.forEach((bodyEle, indx) => {
                  if (
                    typeof bodyEle === "string" &&
                    bodyEle.trim() !== "\n" &&
                    bodyEle.trim() !== "\n\n" &&
                    bodyEle.trim() !== ""
                  ) {
                    ele.content[indx] = { type: "p", content: [bodyEle] };
                  }
                });
              }
            });
          }

          const modifiedDitaCode = await JSONToHTML(
            characterToEntity(cleanedUpJson)
          );

          let originalPath = filePath.path
            .replace(/\\/g, "/")
            .split("/")
            .slice(1)
            .join("/");

          function replaceFileName(filePath, newFileName) {
            const pathParts = filePath.split("/");
            pathParts[pathParts.length - 1] = newFileName;
            return pathParts.join("/");
          }

          let newNewPath = replaceFileName(
            originalPath,
            `${filePath.name.split(".")[0]}_task_${generateRandomId(6)}.md`
          );

          let outputFilePath = "";

          if (newNewPath.endsWith(".md")) {
            // Replace ".md" with ".dita"
            outputFilePath = `${outputDirName}${newNewPath.replace(
              /\.md$/,
              ".dita"
            )}`;
          } else if (newNewPath.endsWith(".mdx")) {
            // Replace ".mdx" with ".dita"
            outputFilePath = `${outputDirName}${newNewPath.replace(
              /\.mdx$/,
              ".dita"
            )}`;
          }

          const outputDir = path.dirname(outputFilePath);

          createDirectory(outputDirName);
          createDirectory(outputDir.toLowerCase());

          // ditaMapEntries.push({ path: outputFilePath, type: "task" });

          // ditaMapEntries[ditaMapEntries.length - 1].folderPath.push({
          //   file: [
          //     {
          //       path: outputFilePath,
          //       type: "task",
          //     },
          //   ],
          // });

          fs.writeFileSync(
            outputFilePath.toLowerCase(),
            xmlFormat(
              `<?xml version="1.0" encoding="UTF-8"?>\n
              <!DOCTYPE task PUBLIC "-//OASIS//DTD DITA Task//EN" "task.dtd">
              ` + modifiedDitaCode,
              {
                indentation: "  ",
                filter: (node) => node.type !== "Comment",
                collapseContent: true,
                lineSeparator: "\n",
              }
            ),
            "utf-8"
          );

          console.log(
            "\x1b[35m%s\x1b[0m",
            "Successfully parsed =>",
            outputFilePath
          );

          let taskData = {
            originalFile: filePath.path.replace(/\\/g, "/"),
            taskData: {
              title: "",
              level: "2",
              path: outputFilePath,
              child: [],
            },
          };

          addTask(taskData);
          // console.log(modifiedDitaCode);

          taskData = {};

          // logData.parsedFiles.push(outputFilePath);
          resolve(); // Resolve the promise upon successful completion
        } catch (error) {
          console.log(error, filePath);
          reject(error); // Reject the promise if an error occurs
        }
      })
      .catch(reject); // Pass any errors from JSONToHTML or HTMLToJSON to the outer promise
  });
}

module.exports = taskFileMaker;
