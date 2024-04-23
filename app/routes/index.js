var express = require(`express`);
var router = express.Router();
var mysql = require(`mysql`);
var data;

/*
var my_database = mysql.createConnection({
  host: `devcluster-db1de0c8f27-b5oqenmt7uja.cnrlilsute9n.ap-southeast-2.rds.amazonaws.com`,
  port: `3306`,
  user: `postgres`,
  password: `cy5m4UJQ4xPEx6r8`,
  database: `my_awesome_db`,
});
my_database.connect(function (err) {
  if (err) throw err;
  console.log("connected");
  my_database.query(
    "SELECT * from $YOUR_TABLE",
    function (err, result, fields) {
      if (err) throw err;
      data = result;
    }
  );
});
*/
const foo = {
  foundation: "Mozilla",
  model: "box",
  week: 45,
  transport: "car",
  month: 7,
};

JSON.stringify(foo, ["week", "month"]);

router.get(`/`, function (req, res, next) {
  //res.send(JSON.stringify(data));
  res.send(JSON.stringify(foo, ["week", "month"]));
});
module.exports = router;
