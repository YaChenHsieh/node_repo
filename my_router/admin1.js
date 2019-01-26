module.exports = app => {
  app.get("/admin1/:p1?/:p2?", (request, response) => {
    response.send("admin1:" + JSON.stringify(request.params));
  });
};
