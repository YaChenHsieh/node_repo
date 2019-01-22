const express = require("express");
const router = express.Router();

router
  .route("/member/edit/:id")
  .all((request, response, next) => {
    request.locals.memberData = {
      name: "Jude",
      id: "A001"
    };
    next();
  })

  .get((request, response) => {
    const obj = {
      baseUrl: request.baseUrl,
      data: resquest.locals.memberData
    };
    response.send("get edit:", JSON.stringify(obj));
  })

  .post((request, response) => {
    response.send("post edit:", JSON.stringify(response.locals.memberData));
  });

module.exports = router;
