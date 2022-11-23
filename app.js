const express = require("express");
const path = require("path");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const dbPath = path.join(__dirname, "todoApplication.db");
const app = express();
app.use(express.json());

let db = null;
const initializerOfDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("server is running.....");
    });
  } catch (e) {
    console.log(`Db error: ${e.message}`);
    process.exit(1);
  }
};
initializerOfDbAndServer();

//1
app.get("/todos/", async (request, response) => {
  const { status, priority, search_q = "" } = request.query;
  let getQuery = null;
  if (priority === undefined && status === undefined) {
    getQuery = `
        SELECT *
        FROM todo
        WHERE todo LIKE '%${search_q}%';`;
  } else if (priority === undefined && status !== undefined) {
    getQuery = `
    SELECT *
    FROM todo
    WHERE todo LIKE '%${search_q}%' AND
    status = '${status}';`;
  } else if (status === undefined && priority !== undefined) {
    getQuery = `
    SELECT *
    FROM todo
    WHERE todo LIKE '%${search_q}%' AND
    priority = '${priority}';`;
  } else {
    getQuery = `
        SELECT *
        FROM todo
        WHERE todo LIKE '%${search_q}%' AND
        status = '${status}' AND
        priority = '${priority}';`;
  }
  const result = await db.all(getQuery);
  response.send(result);
});

//2

app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const details = `
    SELECT * FROM todo 
    WHERE id = ${todoId};`;
  const result = await db.get(details);
  response.send(result);
});

//3
app.post("/todos/", async (request, response) => {
  const requestBody = request.body;
  const addQuery = `INSERT INTO
    todo(id,todo,priority,status)
    VALUES (${requestBody.id},
        '${requestBody.todo}',
        '${requestBody.priority}',
        '${requestBody.status}');`;
  await db.run(addQuery);
  response.send("Todo Successfully Added");
});

//4
app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const requestBody = request.body;
  let update = "";
  if (requestBody.todo !== undefined) {
    update = "Todo";
  }
  if (requestBody.status !== undefined) {
    update = "Status";
  }
  if (requestBody.priority !== undefined) {
    update = "Priority";
  }
  const previousQuery = `
    SELECT * FROM todo 
    WHERE id = ${todoId};`;
  const previous = await db.get(previousQuery);
  const {
    todo = previous.todo,
    priority = previous.priority,
    status = previous.status,
  } = request.body;
  const updateQuery = `
  UPDATE todo 
  SET todo = '${todo}',
  priority='${priority}',
  status='${status}';
  `;
  await db.run(updateQuery);
  response.send(`${update} Updated`);
});

//5

app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const details = `
    DELETE FROM todo 
    WHERE id = ${todoId};`;
  const result = await db.run(details);
  response.send("Todo Deleted");
});
module.exports = app;
