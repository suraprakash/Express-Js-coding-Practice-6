const express = require("express");
const path = require("path");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "covid19India.db");

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

const objectToCamel = (newObject) => {
  return {
    stateId: newObject.state_id,
    stateName: newObject.state_name,
    population: newObject.population,
  };
};

const districtSnakeToCamel = (newObject) => {
  return {
    districtId: newObject.district_id,
    districtName: newObject.district_name,
    stateId: newObject.state_id,
    cases: newObject.cases,
    cured: newObject.cured,
    active: newObject.active,
    deaths: newObject.deaths,
  };
};

const reportSnakeToCamelCase = (newObject) => {
  return {
    totalCases: newObject.cases,
    totalCured: newObject.cured,
    totalActive: newObject.active,
    totalDeaths: newObject.deaths,
  };
};

app.get("/states/", async (request, response) => {
  const getStatesQuery = `
        SELECT
            *
        FROM
            state;`;
  const stateList = await db.all(getStatesQuery);
  const stateResult = stateList.map((eachObject) => {
    return objectToCamel(eachObject);
  });
  response.send(stateResult);
});

app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const getStatesQuery = `
        SELECT
            *
        FROM
            state
        WHERE
            state_id = ${stateId};`;
  const stateListById = await db.get(getStatesQuery);
  const stateResultById = objectToCamel(stateListById);
  response.send(stateResultById);
});

app.post("/districts/", async (request, response) => {
  const createDistrict = request.body;
  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = createDistrict;
  const postDetailsQuery = `
        INSERT INTO
            district (district_name, state_id, cases, cured, active, deaths)
        VALUES 
          ('${districtName}',
            ${stateId},
            ${cases},
            ${cured},
            ${active},
            ${deaths});`;
  const insertResult = await db.run(postDetailsQuery);

  response.send("District Successfully Added");
});

app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictQuery = `
        SELECT
            *
        FROM
            district
        WHERE
            district_id = ${districtId};`;
  const districtListById = await db.get(getDistrictQuery);

  response.send(districtSnakeToCamel(districtListById));
});

app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const deleteDistrictQuery = `
        DELETE 
            FROM district
        WHERE
            district_id = ${districtId};`;
  const deleteDistrictResult = await db.run(deleteDistrictQuery);
  response.send("District Removed");
});

app.put("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const createDistrict = request.body;
  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = createDistrict;
  const updateDistrictQuery = `
        UPDATE 
            district
        SET
            district_name = '${districtName}',
            state_id = ${stateId},
            cases = ${cases},
            cured = ${cured},
            active = ${active},
            deaths = ${deaths}
        WHERE
            district_id = ${districtId};`;
  await db.run(updateDistrictQuery);
  response.send("District Details Updated");
});

app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const getStatsQuery = `
        SELECT
            SUM(cases) as totalCases,
            SUM(cured) as totalCured,
            SUM(active) as totalActive,
            SUM(deaths) as totalDeaths
        FROM
            district
        WHERE
            state_id = ${stateId};`;
  const statsListById = await db.get(getStatsQuery);

  response.send(statsListById);
});

app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictQuery = `
        SELECT
           state_name As stateName
        FROM
            district INNER JOIN state ON district.state_id = state.state_id
        WHERE
            district_id = ${districtId};`;
  const districtListById = await db.get(getDistrictQuery);

  response.send(districtListById);
});

module.exports = app;
