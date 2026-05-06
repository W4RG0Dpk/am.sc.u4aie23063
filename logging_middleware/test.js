const Log = require("./logger");

async function testLogger() {

  await Log(
    "backend",
    "info",
    "controller",
    "Notification controller initialized successfully"
  );

}

testLogger();