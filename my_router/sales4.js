const router = require("express").Router();
const mysql = require("mysql");
const moment = require("moment-timezone");
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "root",
  database: "test"
});
db.connect();

router.use((req, res, next) => {
  if (!req.session.loginUser) {
    res.status(403);
    res.send("you must login to visit");
  } else {
    next();
  }
});

router.get("/", (req, res) => {
  db.query(
    "SELECT * FROM `sales` ORDER BY sid DESC",
    (error, results, fields) => {
      results.forEach(function(el) {
        el.birth = moment(el.birthday).format("YYYY-MM-DD");
      });
      res.render("sales3", {
        sales: results
      });
    }
  );
});

router.get("/add", (req, res) => {
  res.send("sales4-add");
});

module.exports = router;
