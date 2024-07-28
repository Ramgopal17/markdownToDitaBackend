const fs = require("fs");
const path = require("path");

function isURL(str) {
  // Regular expression to match URL pattern
  var urlPattern =
    /^(?:(?:https?:)?\/\/)?(?:www\.)?([\w.]+)\.([a-z]{2,})([\w\/.-]*)*\/?$/;
  return urlPattern.test(str);
}

function isFileReady(filePath) {
  return new Promise((resolve, reject) => {
    fs.access(filePath, fs.constants.R_OK, (err) => {
      if (err) {
        resolve(false);
      } else {
        resolve(true);
      }
    });
  });
}

// Function to capitalize the first letter of a word
function capitalizeFirstWord(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// Function to copy images to the output folder
function copyImages(imagePaths, outputFolder) {
  if (!fs.existsSync(outputFolder)) {
    fs.mkdirSync(outputFolder, { recursive: true });
  }

  const imagesFolder = path.join(outputFolder, "images");
  if (!fs.existsSync(imagesFolder)) {
    fs.mkdirSync(imagesFolder);
  }

  imagePaths.forEach((imagePath) => {
    const imageName = path.basename(imagePath);
    const dest = path.join(imagesFolder, imageName);

    try {
      fs.copyFileSync(imagePath, dest);
    } catch (error) {
      console.error(`Error copying ${imageName}: ${error.message}`);
    }
  });

  console.log("All images copied successfully.");
}

function createXMLStructure(data) {
  let xmlStructure = "";

  data.child?.forEach((item) => {
    let ditaFilePath = item.path
      .split("/")
      .filter((s) => s !== ".")
      .filter((_, index) => index !== 0)
      .join("/");

    ditaFilePath = ditaFilePath.startsWith("/")
      ? ditaFilePath.slice(1)
      : ditaFilePath;

    xmlStructure += `<topicref href="${ditaFilePath.toLowerCase()}" navtitle="${
      item.title
    }"`;

    if (item.child && Array.isArray(item.child) && item.child.length > 0) {
      xmlStructure +=
        ">\n" + createXMLStructure({ child: item.child }) + "</topicref>\n";
    } else {
      xmlStructure += "/>\n";
    }
  });

  return xmlStructure;
}

module.exports = {
  isURL,
  isFileReady,
  capitalizeFirstWord,
  copyImages,
  createXMLStructure,
};
