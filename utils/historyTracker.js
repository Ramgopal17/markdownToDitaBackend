const useragent = require("useragent");

const LoginDetails = require("../models/userAgentDetailsModel");

async function historyTracker(req) {
  const ip = req.clientIp || req.ip;
  const agent = useragent.parse(req.headers["user-agent"]);

  // login details
  const LogDetails = {
    userId: req.user.id,
    email: req.user.email,
    fileName: req.files.zipFile.name,
    ip: ip,
    browser: agent.toAgent(),
    os: agent.os.toString(),
  };
  const loginDetails = new LoginDetails(LogDetails);
  await loginDetails.save();
}

module.exports = historyTracker;
