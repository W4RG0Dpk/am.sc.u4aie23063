require("dotenv").config();

const axios = require("axios");


AUTH_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJNYXBDbGFpbXMiOnsiYXVkIjoiaHR0cDovLzIwLjI0NC41Ni4xNDQvZXZhbHVhdGlvbi1zZXJ2aWNlIiwiZW1haWwiOiJ2ZWxhbWFsYXBhdmFua3Jpc2huYUBnbWFpbC5jb20iLCJleHAiOjE3NzgwNTc3NzIsImlhdCI6MTc3ODA1Njg3MiwiaXNzIjoiQWZmb3JkIE1lZGljYWwgVGVjaG5vbG9naWVzIFByaXZhdGUgTGltaXRlZCIsImp0aSI6IjJkYTFhMjJhLTE0MmEtNGJhYi1iOTVkLTNmMGNiZjAyM2Q4YSIsImxvY2FsZSI6ImVuLUlOIiwibmFtZSI6InZlbGFtYWxhIHBhdmFuIGtyaXNobmEiLCJzdWIiOiIxMDkwZjRmZS1jOTJkLTQwOTUtOTcyMC1lOWVmNWQwMjhjNTQifSwiZW1haWwiOiJ2ZWxhbWFsYXBhdmFua3Jpc2huYUBnbWFpbC5jb20iLCJuYW1lIjoidmVsYW1hbGEgcGF2YW4ga3Jpc2huYSIsInJvbGxObyI6ImFtLnNjLnU0YWllMjMwNjMiLCJhY2Nlc3NDb2RlIjoiUFRCTW1RIiwiY2xpZW50SUQiOiIxMDkwZjRmZS1jOTJkLTQwOTUtOTcyMC1lOWVmNWQwMjhjNTQiLCJjbGllbnRTZWNyZXQiOiJ0WUJDYlpEa0pRSEVHalJEIn0.j0JS6JgZm7EDhwK3TeQ3Ik6hxoHihdxCJTpRpffEjX0"
const VALID_STACKS = ["backend", "frontend"];

const VALID_LEVELS = [
  "debug",
  "info",
  "warn",
  "error",
  "fatal",
];

const VALID_PACKAGES = [
  "cache",
  "controller",
  "cron_job",
  "db",
  "domain",
  "handler",
  "repository",
  "route",
  "service",

  "api",
  "component",
  "hook",
  "page",
  "state",
  "style",

  "auth",
  "config",
  "middleware",
  "utils",
];


async function Log(stack, level, packageName, message) {
  try {

    if (!VALID_STACKS.includes(stack)) {
      throw new Error(
        `Invalid stack value: ${stack}`
      );
    }

    if (!VALID_LEVELS.includes(level)) {
      throw new Error(
        `Invalid level value: ${level}`
      );
    }

    if (!VALID_PACKAGES.includes(packageName)) {
      throw new Error(
        `Invalid package value: ${packageName}`
      );
    }

    if (
      !message ||
      typeof message !== "string" ||
      message.trim().length === 0
    ) {
      throw new Error(
        "Message must be a non-empty string"
      );
    }

    const payload = {
      stack,
      level,
      package: packageName,
      message,
    };


    const response = await axios.post(
      "http://20.207.122.201/evaluation-service/logs",
      payload,
      {
        headers: {
          Authorization: `Bearer ${process.env.AUTH_TOKEN}`,
          "Content-Type": "application/json",
        },
        timeout: 5000,
      }
    );


    console.log(
      "Log created successfully:",
      response.data
    );

  } catch (error) {

    if (error.response) {
      console.error(
        "Logging API Error:",
        error.response.status,
        error.response.data
      );
    } else {
      console.error(
        "Logging Middleware Error:",
        error.message
      );
    }
  }
}

module.exports = Log;