const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
const PORT = 3000;
const uri =
  "mongodb+srv://new_user2:9QwkbzVbWZ94cf79@logsearch.vn0ckun.mongodb.net/?retryWrites=true&w=majority";

async function connect() {
  try {
    await mongoose.connect(uri, {});
    console.log("Connected to the database");
  } catch (error) {
    console.error("Error connecting to the database:", error.message);
  }
}
connect();
const LogSchema = new mongoose.Schema({
  unique_id: { type: String, unique: true },
  level: String,
  message: String,
  resourceId: String,
  timestamp: Date,
  datetime: { type: Date, default: Date.now },
  traceId: String,
  spanId: String,
  commit: String,
  metadata: {
    parentResourceId: String,
  },
});
const Log = mongoose.model("Log", LogSchema);
let logsInMemory = [];
let displayedUniqueIds = [];
app.use(bodyParser.json());
app.use(cors());
app.post("/ingest", async (req, res) => {
  try {
    const log = req.body;
    const datetime = new Date(log.timestamp).toISOString();
    log.datetime = datetime;

    // Generate a unique ID for each log entry
    const unique_id = generateUniqueId();
    log.unique_id = unique_id;

    // Store in memory
    logsInMemory.push(log);
    // console.log(log);
    // Store in database
    await Log.create(log);

    res.status(201).json({ message: "Log ingested successfully" });
  } catch (error) {
    console.error("Error ingesting log:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Query Interface
app.post("/search", async (req, res) => {
  try {
    const queryParams = req.body;
    displayedUniqueIds = [];
    // Retrieve logs from memory and database
    const logsInMemory = getLogsInMemory(queryParams);
    const logsInDatabase = await getLogsInDatabase(queryParams);
    // Combine and filter logs
    const allLogs = [...logsInMemory, ...logsInDatabase];
    const filteredLogs = filterLogs(queryParams, allLogs);
    res.status(200).json(updateDisplayedUniqueIds(filteredLogs));
  } catch (error) {
    console.error("Error searching logs:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

function generateUniqueId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function getLogsInMemory(queryParams) {
  return logsInMemory;
}
function buildDatabaseQuery(queryParams) {
  const dbQuery = {};

  if (queryParams.level) {
    dbQuery.level = queryParams.level;
  }
  if (queryParams.message) {
    dbQuery.message = new RegExp(queryParams.message, "i");
  }
  if (queryParams.resourceId) {
    dbQuery.resourceId = queryParams.resourceId;
  }
  if (queryParams.timestampStart || queryParams.timestampEnd) {
    dbQuery.datetime = {
      $gte: new Date(queryParams.timestampStart),
      $lte: new Date(queryParams.timestampEnd),
    };
  }
  if (queryParams.traceId) {
    dbQuery.traceId = queryParams.traceId;
  }
  if (queryParams.spanId) {
    dbQuery.spanId = queryParams.spanId;
  }
  if (queryParams.commit) {
    dbQuery.commit = queryParams.commit;
  }
  if (queryParams.parentResourceId) {
    dbQuery["metadata.parentResourceId"] = queryParams.parentResourceId;
  }

  return dbQuery;
}

async function getLogsInDatabase(queryParams) {
  const dbQuery = buildDatabaseQuery(queryParams);
  const logsInDatabase = await Log.find(dbQuery);
  return logsInDatabase;
}

function filterLogs(queryParams, logs) {
  return logs.filter((log) => {
    return (
      (!queryParams.level || log.level === queryParams.level) &&
      (!queryParams.message ||
        log.message
          .toLowerCase()
          .includes(queryParams.message.toLowerCase())) &&
      (!queryParams.resourceId || log.resourceId === queryParams.resourceId) &&
      (!queryParams.timestampStart ||
        new Date(log.timestamp) >= new Date(queryParams.timestampStart)) &&
      (!queryParams.timestampEnd ||
        new Date(log.timestamp) <= new Date(queryParams.timestampEnd)) &&
      (!queryParams.traceId || log.traceId === queryParams.traceId) &&
      (!queryParams.spanId || log.spanId === queryParams.spanId) &&
      (!queryParams.commit || log.commit === queryParams.commit) &&
      (!queryParams.parentResourceId ||
        log.metadata.parentResourceId === queryParams.parentResourceId) &&
      !displayedUniqueIds.includes(log.unique_id)
    );
  });
}

function updateDisplayedUniqueIds(logs) {
  const newUniqueLogs = [];
  logs.forEach((log) => {
    const isNewUnique = !displayedUniqueIds.includes(log.unique_id);
    if (isNewUnique) {
      displayedUniqueIds.push(log.unique_id);
      newUniqueLogs.push(log);
    }
  });
  return newUniqueLogs;
}
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
