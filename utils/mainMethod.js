const markdownIt = require("markdown-it");
const emoji = require("markdown-it-emoji").full;

const md = new markdownIt()
  .use(emoji /* , options */)
  .use(require("markdown-it-sup"))
  .use(require("markdown-it-sub"))
  .use(require("markdown-it-footnote"))
  .use(require("markdown-it-mark"))
  .use(require("markdown-it-deflist"))
  .use(require("markdown-it-task-lists"))
  .use(require("markdown-it-inline-comments"))
  .use(require("markdown-it-attrs"), {
    leftDelimiter: "{",
    rightDelimiter: "}",
    allowedAttributes: [],
  })
  .use(require("markdown-it-container"), "warning")
  .use(require("markdown-it-container"), "note")
  .use(require("markdown-it-container"), "notice")
  .use(require("markdown-it-container"), "attention")
  .use(require("markdown-it-container"), "danger")
  .use(require("markdown-it-container"), "fastpath")
  .use(require("markdown-it-container"), "important")
  .use(require("markdown-it-container"), "remember")
  .use(require("markdown-it-container"), "restriction")
  .use(require("markdown-it-container"), "tip")
  .use(require("markdown-it-container"), "trouble")
  .use(require("markdown-it-container"), "caution")
  .use(require("markdown-it-jsx"));
// .use(require("../mardownIt-custom-plugin/ignore-import-statements.js"))
// .use(require("../mardownIt-custom-plugin/ignoreCustomTags.js"));

const fs = require("fs");
const path = require("path");
const grayMatter = require("gray-matter");

const { HTMLToJSON } = require("html-to-json-parser");
const { JSONToHTML } = require("html-to-json-parser");

const cheerio = require("cheerio");

const moveTitleAboveBody = require("./moveTitleAboveBody.js");
const moveTgroupClosingTagBeforeTable = require("./moveTgroupClosingTagBeforeTable.js");

const characterToEntity = require("./characterToEntity.js");

const removeUnwantedElements = require("./removeUnwantedElements.js");
const extractHTML = require("./extractHTML.js");
const taskFileMaker = require("./taskFileMaker.js");
// const addTopicTag = require("../mardownIt-custom-plugin/addTopicTag__notInUse.js");
const SortTopicsTags = require("./SortTopicsTags.js");
const addTopicTag = require("./addTopicTag.js");
const logFileGenerator = require("./logFileGenerator.js");
const outerBodyTagRemover = require("./outterBodyTagRemover.js");

const fileSeparator = require("./fileSeparator.js");

const { addSkippedFiles, getLogData } = require("../state/logData.js");

const processTopicWise = require("./processTopicWise.js");
const { isFileReady } = require("./helper.js");

const outputDirName = "./output/";

// Function to check files in a folder
async function checkFilesInFolder(folderPath) {
  try {
    const files = await fs.promises.readdir(folderPath);

    // Array to store promises returned by processing individual files
    const fileProcessingPromises = [];

    for (const file of files) {
      const filePath = path.join(folderPath, file);
      const stats = await fs.promises.stat(filePath);
      if (stats.isDirectory()) {
        // Recursively process directories
        fileProcessingPromises.push(checkFilesInFolder(filePath));
      } else if (stats.isFile()) {
        if (file.endsWith(".md") || file.endsWith(".mdx")) {
          // Process individual files
          fileProcessingPromises.push(
            mainMethod({ name: file, path: filePath }, stats)
          );
        } else {
          addSkippedFiles(filePath);
        }
      }
    }

    // Wait for all file processing promises to resolve
    await Promise.all(fileProcessingPromises);

    // Generate log files
    let logger = getLogData();
    logFileGenerator(logger, outputDirName);
  } catch (error) {
    console.error("Error reading directory:", error);
    throw error; // Propagate the error up
  }
}

// Main method to process individual files

async function mainMethod(filePath, stats) {
  const fileInfo = { file: filePath.path.replace(/\\/g, "/") };

  try {
    if (stats.isFile()) {
      const ready = await isFileReady(filePath.path);
      if (ready) {
        const fileData = fs.readFileSync(filePath.path, {
          encoding: "utf8",
          flag: "r",
        });

        const { content, data } = grayMatter(fileData);

        // addTopicTag(md, false);
        const mdToHtml = md.render(content);

        // console.log(mdToHtml);

        const fullHtml = `<!DOCTYPE html>
<html>    
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body>
    ${mdToHtml}
</body>
</html>
  `;

        const $ = cheerio.load(fullHtml);

        // Add <tgroup> and <colspec> tags to tables
        $("table").each((index, element) => {
          const numCols = $(element).find("thead th").length;
          // Add <tgroup> with cols="numCols" attribute
          $(element).prepend(`<tgroup cols="${numCols}">`);
          // Add <colspec> tags based on numCols
          for (let i = 1; i <= numCols; i++) {
            $(element).find("tgroup").append(`<colspec colname="c${i}"/>`);
          }
        });

        const modifiedHtml = $.html();
        const contentWithHmtlAsRootElement = extractHTML(modifiedHtml);

        // console.log(contentWithHmtlAsRootElement);

        let footNoteList = [];
        let result = await HTMLToJSON(contentWithHmtlAsRootElement, false);
        // console.log(result);

        // remove unwanted elements such as \n
        function removeNewlines(array) {
          return array.filter(
            (item) => typeof item !== "string" || item !== "\n"
          );
        }

        // Extract footnotes elements and store them in footNoteList
        result.content.map((e) => {
          if (e.type === "body") {
            e.content.map((ele) => {
              if (ele.type === "section") {
                const hehe = removeNewlines(ele.content);
                footNoteList = removeNewlines(hehe[0].content);
              }
            });
          }
        });

        // console.log(result.content[2].content);
        //! This is for filtering Custom Components which are used in .md or .mdx files
        // result.content[2].content[1].content =
        //   result.content[2].content[1].  .filter(
        //     (token) => typeof token.content === "object"
        //   );

        result = removeUnwantedElements(
          result,
          {} /*parent tag details*/,
          "" /*parent div class*/
        );

        // console.log(result);
        result = characterToEntity(result);

        // Preprocess footNoteList into a Map for efficient lookup

        const footNoteMap = new Map();
        footNoteList.forEach((obj) => {
          footNoteMap.set(obj.attributes.id, obj.content[0].content[0]);
        });

        // Main logic -- FootNote
        result.content.forEach((e) => {
          if (e.type === "body") {
            e.content.forEach((ele) => {
              if (ele.type === "p") {
                ele.content.forEach((g) => {
                  if (g.content !== undefined) {
                    let footId = g.content[0].attributes?.href.split(";")[1];
                    const line = footNoteMap.get(footId);
                    if (line) {
                      g.type = "fn";
                      g.content = [line];
                      delete g.attributes;
                    }
                  }
                });
              }
              if (
                ele.type === "section" &&
                ele.attributes?.class === "footnotes"
              ) {
                ele.content = []; // Clear content
                ele.type = ""; // Clear type
                ele.attributes = {}; // Clear attributes
              }
            });
          }
        });

        // check if ul is after title or ul is after title and p
        function isUlAfterTitle(data) {
          const content = removeNewlines(data);

          const taskData = { found: false, positions: [] };

          for (let i = 0; i < content.length; i++) {
            if (
              content[i].type === "ul" &&
              content[i].attributes?.class === "contains-task-list"
            ) {
              taskData.found = true;
              taskData.positions.push(i);
            }

            //! uncomment this code if you want to check ul after title and p

            // if (content[i].type === "title" && content[i + 1].type === "ul") {
            //   taskData.found = true;
            //   taskData.positions.push(i, i + 1);
            // } else if (
            //   content[i].type === "title" &&
            //   content[i + 1].type === "p" &&
            //   content[i + 2].type === "ul"
            // ) {
            //   taskData.found = true;
            //   taskData.positions.push(i, i + 1, i + 2);
            // }
            // else {
            //   taskData.found = false;
            //   taskData.positions = [];
            // }
          }

          return taskData;
        }

        const promises = [];
        result.content.forEach((e) => {
          if (e.type === "body") {
            const filteredData = e.content.filter(
              (item) => typeof item !== "string" || item.trim() !== ""
            );
            const { found, positions } = isUlAfterTitle(filteredData);

            if (found) {
              for (let i = positions.length - 1; i >= 0; i--) {
                let taskBody = {
                  type: "body",
                  content: [],
                };

                taskBody.content.unshift(filteredData[positions[i]]);
                filteredData.splice(positions[i], 1);

                const newObj = {
                  ...taskBody,
                  content: [
                    "\n",
                    ...taskBody.content.flatMap((item) => [item, "\n"]),
                  ],
                };

                // Push the promise returned by taskFileMaker to the array
                promises.push(
                  taskFileMaker(filePath, newObj)
                    .then(() => {
                      console.log("taskFileMaker successfully completed.");
                      // Proceed with further operations if needed
                    })
                    .catch((error) => {
                      console.error(
                        "Error occurred while running taskFileMaker:",
                        error
                      );
                      // Handle error appropriately
                    })
                );
              }
            }

            e.content = filteredData;
          }
        });

        // Wait for all promises to resolve

        await Promise.all(promises)
          .then(async () => {
            // Proceed with further operations if needed
            const res = await JSONToHTML(result);
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

              const modifiedDitaCode = codeRestructure(
                await JSONToHTML(characterToEntity(cleanedUpJson))
              );

              let topicWise = fileSeparator(modifiedDitaCode);

              let newPath = filePath.path
                .replace(/\\/g, "/")
                .split("/")
                .slice(1)
                .join("/");

              fileInfo.nestObj = [];

              await processTopicWise(
                topicWise,
                newPath,
                outputDirName,
                fileInfo,
                filePath
              )
                .then(() => {
                  console.log("All topics processed successfully.");
                })
                .catch((error) => {
                  console.error("Error processing topics:", error);
                });
            } catch (error_1) {
              console.log(error_1, filePath);
            }
          })
          .catch((error) => {
            console.error("Error occurred while running taskFileMaker:", error);
          });
      } else {
        console.log(`File "${filePath.path}" is not ready.`);
      }
    }
  } catch (error) {
    console.error("Error processing file:", error);
    throw error; // Propagate the error up
  }
}

function codeRestructure(xmlString) {
  let newXmlString = moveTitleAboveBody(xmlString);
  let newNew = moveTgroupClosingTagBeforeTable(newXmlString);
  let addedTopicTag = addTopicTag(newNew);
  let SortedTopicsTags = SortTopicsTags(addedTopicTag);
  let outterBody = outerBodyTagRemover(SortedTopicsTags);

  return outterBody;
}

module.exports = checkFilesInFolder;
