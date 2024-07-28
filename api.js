const express = require("express");
const fileUpload = require("express-fileupload");
const fs = require("fs");
const path = require("path");
const cors = require("cors");
const shell = require("shelljs");
const checkFilesInFolder = require("./utils/mainMethod");
const preFlightChecker = require("./utils/preFlightChecker");
const app = express();
app.use(cors());
app.use(express.json());

const requestIp = require("request-ip");
app.use(requestIp.mw());

const bcrypt = require("bcrypt");

require("dotenv").config({ path: "./.env" });
const PORT = process.env.PORT || 8448;
const BASE = process.env.BASE;

const User = require("./models/userModel");

const AdmZip = require("adm-zip");
const archiver = require("archiver");
const fileValidator = require("./utils/fileValidator");
const isValidDirectory = require("./utils/ValidDirectory");
const {
  getData,
  resetTaskList,
  getTaskList,
  resetDitaMapData,
} = require("./state/ditaMap");
const xmlFormat = require("xml-formatter");
const { resetlogData, getLogData } = require("./state/logData");
const { resetTopicData } = require("./state/topicData");
const xRefPathFixer = require("./utils/xRefPathFixer");
const { copyImages, createXMLStructure } = require("./utils/helper");
const {
  setInputFileName,
  getInputFileName,
  resetInputFileName,
} = require("./state/allVeriables");
const verifyUser = require("./middleware/user");
const connectDB = require("./database/db");
const generateToken = require("./middleware/generateToken");
const historyTracker = require("./utils/historyTracker");

app.use(fileUpload()); // Add file upload middleware

let inputFolderDir = "input";
const outputFolderPath = "./output";

// API route to handle file upload and processing
app.post("/api/upload", verifyUser, async (req, res) => {
  try {
    // await verifyUser(req, res);

    const inputDir = path.join(__dirname, inputFolderDir);
    const outputDir = path.join(__dirname, outputFolderPath);

    // Recreate 'input' and 'output' directories
    shell.rm("-rf", inputDir);
    shell.mkdir("-p", inputDir);

    shell.rm("-rf", outputDir);
    shell.mkdir("-p", outputDir);

    if (!req.files || !req.files.zipFile) {
      return res.status(400).json({
        message: "No zip file provided",
        status: 400,
        token: req.headers.token,
      });
    }

    const zipFile = req.files.zipFile;
    const inputFilePath = path.join(inputDir, zipFile.name);

    // Move the uploaded zip file to the input directory
    await zipFile.mv(inputFilePath);

    // Extract the zip file
    const zip = new AdmZip(inputFilePath);
    zip.extractAllTo(inputDir, true);

    // Validate files asynchronously
    fileValidator(inputDir)
      .then((counts) => {
        if (counts.mdCounter === 0) {
          // If no markdown files found, delete the input directory
          shell.rm("-rf", inputDir);
          return res.status(400).json({
            message: "No markdown files found in zip file.",
            status: 400,
            token: req.headers.token,
          });
        } else {
          // If markdown files found, send success response
          historyTracker(req);
          return res.status(200).json({
            message: "Zip file uploaded and extracted successfully.",
            status: 200,
            token: req.headers.token,
          });
        }
      })
      .catch((error) => {
        console.error("Error validating files:", error);
        return res.status(500).json({
          message: "Internal server error during file validation",
          status: 500,
          token: req.headers.token,
        });
      })
      .finally(() => {
        // Remove the zip file after extraction and validation
        if (fs.existsSync(inputFilePath)) {
          fs.unlinkSync(inputFilePath);
        }
      });
  } catch (error) {
    console.error("Error handling file upload:", error);
    res.status(500).json({
      message: "Internal server error",
      status: 500,
      token: req.headers.token,
    });
  }
});

app.get("/api/markdowntodita", verifyUser, async (req, res) => {
  try {
    // Process the files in the input directory
    const isValid = await isValidDirectory(inputFolderDir);

    if (!isValid) {
      return res.status(404).json({
        message: "Please upload zip file first!",
        status: 404,
        token: req.headers.token,
      });
    } else if (isValid) {
      // await checkFilesInFolder(inputFolderDir);

      // reset ditaMapData before processing files
      resetDitaMapData();

      checkFilesInFolder(inputFolderDir)
        .then(() => {
          let ignoredFileList = getLogData();

          copyImages(ignoredFileList.skippedFiles, outputFolderPath);

          let nestedFiles = {};

          let getDataArr = getData();

          let tastList = getTaskList();

          tastList.forEach((original) => {
            getDataArr.forEach((fileNest) => {
              if (original.originalFile === fileNest.file) {
                fileNest.nestObj.forEach((nest) => {
                  nest.child.push(original.taskData);
                });
              }
            });
          });

          const uniqueData1 = getDataArr.filter((item, index, self) => {
            return (
              index ===
              self.findIndex(
                (obj) =>
                  obj.file === item.file &&
                  JSON.stringify(obj.nestObj) === JSON.stringify(item.nestObj)
              )
            );
          });

          try {
            uniqueData1.forEach((obj) => {
              obj.nestObj.forEach((ff) => {
                const level = parseInt(ff.level);
                let parent = nestedFiles;

                for (let i = 1; i < level; i++) {
                  if (!parent.child || parent.child.length === 0) {
                    console.error(
                      "Error occurred: Parent has no children.",
                      parent
                    );
                    throw new Error("Parent has no children.");
                  }
                  parent = parent.child[parent.child.length - 1];
                }
                if (!parent.child) parent.child = [];
                parent.child.push(ff);
              });
            });
          } catch (error) {
            console.error("Error occurred:", error.message);
          }

          // Check if the output folder exists
          const folderExists = fs.existsSync(outputFolderPath);
          if (!folderExists) {
            return res.status(404).json({
              message: "Output folder not found",
              status: 404,
              token: req.headers.token,
            });
          }

          // Create a unique identifier for the download link
          const downloadId = Math.random().toString(36).substring(7);
          // const downloadLink = `http://localhost:${PORT}/api/download/${downloadId}`;
          const downloadLink = `${BASE}/api/download/${downloadId}`;

          const downloadPath = path.join(__dirname, "downloads", downloadId);
          fs.mkdirSync(downloadPath, { recursive: true });

          let inputFolderName = "output.zip";

          if (getDataArr.length !== 0) {
            inputFolderName = getDataArr[0].file.split("/")[1] + "_output.zip";
          }

          setInputFileName(inputFolderName);

          const outputZipPath = path.join(downloadPath, inputFolderName);

          // Create a zip file
          const output = fs.createWriteStream(outputZipPath);
          const archive = archiver("zip", {
            zlib: { level: 9 }, // Set compression level
          });

          // Pipe the archive data to the output file
          archive.pipe(output);

          // Add the output folder to the archive
          archive.directory(outputFolderPath, false);

          // Finalize the archive
          archive.finalize();

          const xmlString = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<!DOCTYPE map PUBLIC "-//OASIS//DTD DITA Map//EN" "map.dtd">
 <map>\n${createXMLStructure(nestedFiles)}</map>`;

          fs.writeFileSync(
            `${outputFolderPath}/index.ditamap`,
            xmlFormat(xmlString, {
              indentation: "  ",
              filter: (node) => node.type !== "Comment",
              collapseContent: true,
              lineSeparator: "\n",
            })
          );
          console.log("XML structure created successfully!");

          xRefPathFixer(outputFolderPath)
            .then(() => {
              // Cleanup the uploaded zip file
              cleanupUploadedZip(inputFolderDir, downloadId);

              // Send response indicating successful processing and the download link
              res.status(200).json({
                message: "Files converted successfully.",
                downloadLink,
                status: 200,
                token: req.headers.token,
              });

              // console.log("All files processed successfully.");
              resetTopicData();
            })
            .catch((error) => {
              console.error("Error processing files:", error);
            });
        })
        .then(() => {
          resetDitaMapData();
          resetlogData();
          resetTaskList();

          console.log("ditaLog cleared successfully!");
        })
        .catch((error) => {
          console.error("Error processing files:", error);
        });
    }
  } catch (error) {
    console.error("Error processing files:", error);
    res.status(500).json({
      message: "Internal server error",
      status: 500,
      token: req.headers.token,
    });
  }
});

// API route to download the processed files
app.get("/api/download/:downloadId", (req, res) => {
  let originalFileName = getInputFileName();

  const downloadId = req.params.downloadId;
  const downloadPath = path.join(
    __dirname,
    "downloads",
    downloadId,
    originalFileName
  );

  // Check if the file exists
  if (fs.existsSync(downloadPath)) {
    // Set response headers for downloading the zip file
    res.setHeader("Content-Type", "application/zip");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${originalFileName}"`
    );

    // Pipe the zip file to the response
    const fileStream = fs.createReadStream(downloadPath);
    fileStream.pipe(res);

    resetInputFileName();
  } else {
    res.status(404).json({
      message: "File not found",
      status: 404,
      token: req.headers.token,
    });
  }
});

// Register endpoint
app.post("/api/register", async (req, res) => {
  const { email, password } = req.body;

  try {
    // Generate a salt
    const salt = await bcrypt.genSalt(10);
    // Hash the password with the salt
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create a new user with the hashed password
    const user = new User({ email, password: hashedPassword });

    await user.save();
    res.status(201).json({ message: "User registered", status: 201 });
  } catch (error) {
    res.status(400).json({ message: "User registration failed", status: 400 });
  }
});

// Login endpoint
app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    // Find the user by email
    const user = await User.findOne({ email });

    if (!user) {
      return res
        .status(401)
        .json({ message: "Invalid email or password", status: 401 });
    }

    // Compare the provided password with the hashed password
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res
        .status(401)
        .json({ message: "Invalid email or password", status: 401 });
    }

    // Update last login time
    user.lastLogin = new Date();
    await user.save();

    // Generate a JWT token
    const token = generateToken(user.id);

    res.status(200).json({ message: "Login successful", status: 200, token });
  } catch (error) {
    res.status(500).json({ message: "Internal server error", status: 500 });
  }
});

app.get("/api/checkPreflight", async (req, res) => {
  const filePath = path.join(__dirname, inputFolderDir);

  try {
    const files = await fs.promises.readdir(filePath);

    if (files.length === 0) {
      return res
        .status(400)
        .json({ message: "No files found in the folder", status: 400 });
    }

    let allResults = [];
    let invalidFiles = [];

    try {
      const results = await preFlightChecker(filePath);

      allResults = allResults.concat(results);
    } catch (err) {
      return res.status(500).json({ message: err.message, status: 500 });
    }

    invalidFiles = allResults
      .filter((result) => !result.title)
      .map((result) => result.filePath);

    if (invalidFiles.length > 0) {
      return res.status(400).json({
        message: "The following files do not contain a title.",
        status: 400,
        invalidFiles,
      });
    } else {
      console.log("All files contain a title.");
      return res.status(200).json({ message: "ok", status: 200 });
    }
  } catch (err) {
    return res
      .status(500)
      .json({ message: "Error reading folder", status: 500 });
  } finally {
    allResults = [];
    invalidFiles = [];
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  connectDB();
});

// Function to cleanup the uploaded zip file
function cleanupUploadedZip(inputFolderDir, downloadId) {
  let downloadDir = path.join(__dirname, "downloads");

  try {
    // Remove the directory recursively
    shell.rm("-rf", inputFolderDir);

    const files = fs.readdirSync(downloadDir);

    files.forEach((file) => {
      const filePath = path.join(downloadDir, file);

      if (fs.lstatSync(filePath).isDirectory() && file !== downloadId) {
        shell.rm("-rf", filePath);
      }
    });
  } catch (error) {
    console.error("Error cleaning up uploaded zip file:", error);
  }
}
