const tagsValidator = require("./tagsValidator");
const dtdConcept = require("./dtdConcept.js");
const dtdReference = require("./dtdReference.js");
const dtdTask = require("./dtdTask.js");
const taskStepHandler = require("./taskStepHandler.js");
const processAndWriteData = require("./processAndWriteData.js");

async function processTopicWise(
  topicWise,
  newPath,
  outputDirName,
  fileInfo,
  filePath
) {
  const promises = topicWise.map(async (tc) => {
    let dtdType = "topic";

    // Validate tags
    tc.content = tagsValidator(tc.content);

    try {
      // Check if the content is a concept
      let result = await dtdReference(tc.content);

      if (result.boolValue) {
        dtdType = "reference";
        tc.content = result.content;
      } else {
        // Check if the content is a reference
        const dtdTaskResult = await dtdTask(tc.content);

        if (dtdTaskResult.boolValue) {
          const object = await taskStepHandler(dtdTaskResult);
          dtdType = "task";
          tc.content = object;
        } else {
          let result = await dtdConcept(tc.content);

          if (result.boolValue) {
            dtdType = "concept";
            tc.content = result.content;
          } else {
            dtdType = "topic";
          }
        }
      }

      processAndWriteData(
        tc,
        dtdType,
        newPath,
        outputDirName,
        fileInfo,
        filePath.name
      );
    } catch (error) {
      console.error("Error processing topic:", error);
    }
  });

  // Wait for all promises to complete
  await Promise.all(promises);
}

module.exports = processTopicWise;
