const express = require("express");
const exphbs = require("express-handlebars");

const app = express();
const url = require("url");

//告速伺服器要用bodyParser//============================================
const bodyParser = require("body-parser");

//1.require multer 2.宣告要上傳物件 upload  3.require fs(filesystem)//
const multer = require("multer");
const upload = multer({ dest: "tmp_uploads/" });
const fs = require("fs");

//For router====================================
const admin1 = require("./my_router/admin1.js");
const admin2Router = require("./my_router/admin2.js");
const admin3Router = require("./my_router/admin3.js");
//========================================//

//宣告COOKIE//
const session = require("express-session");
//==================================================

//宣告時間
const moment = require("moment-timezone");

app.use(
  session({
    saveUninitialized: false,
    resave: false,
    secret: "secret",
    cookie: { maxAge: 60000 }
  })
);

//自訂middleware
app.use((request, response, next) => {
  response.locals.renderData = { loginUser : request.session.loginUser };
  next();
});

//DB設定

const mysql = require("mysql");
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "root",
  database: "test"
});
db.connect();
//=====================================================

app.engine(
  "hbs", //引擎名稱
  exphbs({ //設定使用引擎的樣板，和佈局檔
    defaultLayout: "main",
    extname: "hbs", //副檔名稱
    helpers: { list: require("./helpers/list.js") }
  }) //上方list是可自訂的名稱，連動list.js 與 sales2.hbs 的list //
);

app.set("view engine", "hbs");

app.use(express.static("public"));

//=======================================

//全域可以使用bodyParser(url功能)//
app.use(bodyParser.urlencoded({ extended: false }));

//全域可以使用bodyParser(json功能)//
app.use(bodyParser.json());

//======================================

app.get("/abc", (request, response) => {
  response.send("<h2> This is app </h2>");
});

app.get("/", (request, response) => {
  response.send("<h2> Home </h2>");
});

// app.get("/sales", (request, response) => {
//   const sales = require("./data/sales.json");
//   response.render("sales.hbs", {
//     sales: sales,
//     myclass: "bg-warning"
//   });
// });

app.get("/sales", (request, response) => {
  const sales = require("./data/sales.json");
  const data = response.locals.renderData; //宣告data-->使用上方全域變數的response.locals.renderData

  data.sales = sales;
  data.myclass = "table-danger";

  response.render("sales", data);
});

/*下方新增一個跟上方sales一樣的sales2 */
app.get("/sales2", (request, response) => {
  const sales = require("./data/sales.json");
  response.render("sales2", {
    sales: sales
  });
});
//===================================foodfoodfood
app.get("/food",(req,res)=>{
const food= require("./data/food.json");
res.render("food", {food : food});
});

app.post("/form01.html", (request, response) => {
  response.send("Hello Post");
});

app.get("/try-querystring", (request, response) => {
  const urlParts = url.parse(request.url, true);
  urlParts.myQuery = JSON.parse(JSON.stringify(urlParts.query));
  console.log(urlParts);

  response.render("try-querystring", { urlParts: urlParts });
});

//const urlencodeParser = bodyParser.urlencoded({ extended: false });
app.get("/try-post-form", (request, response) => {
  response.render("try-post-form.hbs");
});
//Parser兩種功能(轉義解析): 1.url 2.json
//使用url功能
app.post("/try-post-form", (request, response) => {
  response.render("try-post-form.hbs", {
    email: request.body.email,
    password: request.body.password
  });
});
//使用json功能
app.post("/try-post-form2", (request, response) => {
  response.json(request.body);
});

//上傳//
app.get("/try-upload", (request, response) => {
  response.render("try-upload.hbs");
});

app.post("/try-upload", upload.single("avatar"), (request, response) => {
  console.log(request.file);

  //如果 確認有檔案 && 有檔名//
  if (request.file && request.file.originalname) {
    if (/\.(jpg||jpeg||png)$/i.test(request.file.originalname)) {
      fs.createReadStream(request.file.path).pipe(
        fs.createWriteStream("./public/img/" + request.file.originalname)
      );
    }
  }
  response.render("try-upload.hbs", {
    result: true,
    name: request.body.name,
    avatar: "/img/" + request.file.originalname
  });
});

//測試路由//==============================================
app.get(/^\/hi\/?/, (request, response) => {
  let result = { url: request.url };
  result.split = request.url.split("/");
  request.json(result);
});

//手機路由//=========================================
app.get(/^\/09\d{2}\-?\d{3}\-?\d{3}/, (request, response) => {
  let str = request.url.slice(1);
  str = str.split("-").join("");
  response.send("mobile : " + str);
});

//my router//=============================================
admin1(app);
app.use(require("./my_router/admin2.js"));
app.use("/admin3", require("./my_router/admin3"));

//cookie//======================================

app.get("/try-session", (request, response) => {
  request.session.views = request.session.views || 0;
  request.session.views++;
  response.contentType("text/plain");
  response.write("visited times" + request.session.views + "\n");
  response.end(JSON.stringify(request.session));
});
//=====================================================================
//login設定
app.get("/login", (request, response) => {
  const data = {
    logined: !!request.session.loginUser, //!!轉成布林值true or false值//
    loginUser: request.session.loginUser
  };

  if (request.session.flashMsg) {
    data.flashMsg = request.session.flashMsg;
    delete request.session.flashMsg;
  }

  response.render("login", data);
});

app.post("/login", (request, response) => {
  db.query(
    "SELECT * FROM `admins` WHERE `admin_id`=? AND `password`=SHA1(?)",
    [request.body.user, request.body.password],
    (error, results, fields) => {
      console.log("results");
      if (!results.length) {
        request.session.flashMsg = {
          type: "danger",
          msg: "username or password 錯誤喔"
        };
      } else {
        request.session.loginUser = request.body.user;
        request.session.flashMsg = {
          type: "success",
          msg: "登入成功"
        };
      }
      response.redirect("/login");
    }
  );

  //============================================================================debug
});

app.get("/logout", (request, response) => {
  delete request.session.loginUser;
  response.redirect("/login");
});

//====================================
//時間格式
app.get("/try-moment", (request, response) => {
  response.type = "text/plain";

  const myFormat = "YYYY-MM-DD  HH:mm:ss";

  const mo1 = moment(request.session.cookie.expires);
  const mo2 = moment();

  response.write(mo1.format(myFormat) + "\n");
  response.write(mo2.format(myFormat));
  response.end("");
});
//======================================================
//宣告時間
app.get("/sales3", (request, response) => {
  db.query("SELECT * FROM sales", (error, results, fields) => {
    console.log(results);

    // for (let s in results) {
    //   results[s].birth = moment(results[s].birthday).format("YYYY-MM-DD");
    // }

    //ForEach寫法......上方寫法也可=>參考MND mozilla
    results.forEach(function(el) {
      el.birth = moment(el.birth).format("YYYY-MM-DD");
    });

    response.render("sales3.hbs", { sales: results });
  });
});

//============================================
//新增User欄位
app.get("/sales3/add", (request, response) => {
  response.render("sales3_add.hbs"); //起始畫面
});

app.post("/sales3/add", (request, response) => {
  const data = response.locals.renderData;
  const val = {
    sales_id: request.body.sales_id,
    name: request.body.name,
    birthday: request.body.birthday
  };
  data.addForm = val;

  if (!/^\d{4}\-\d{1,2}\-\d{1,2}$/.test(request.body.birthday)) {
    data.msg = { type: "danger", info: "生日格式有誤" };
    response.render("sales3_add", data);
    return;
  }

  if (!request.body.sales_id || !request.body.name || !request.body.birthday) {
    data.msg = { type: "danger", info: "每欄位皆為必填" };

    response.render("sales3_add", data);
    return;
  }

  db.query(
    "SELECT * FROM sales WHERE sales_id=? AND sid <>?", //sql, //如果有一筆被選到，代表sales_id有重複 (不等於<>)
    [request.body.sales_id, request.params.sid], //val, < 我輸入的ID    ,   我網址上面的參數 >
    (error, results, fields) => {
      //此處results是回傳一個陣列
      if (results.length) {
        //if select 回傳得result 有回傳一個陣列，代表資料庫有這筆資料，所以會有長度//
        data.msg = {
          type: "danger",
          info: "sales_id已被使用!!"
        };
        response.render("sales_add", data);
        return;
      }

      const sql = "INSERT INTO `sales` SET ?";
      db.query(sql, val, (error, results, fields) => {
        //val在上面，sql = (const sql = "INSERT INTO `sales` SET ?";)
        if (error) {
          console.log(error);
          response.send(error.sqlMessage);
          return;
        }

        if (results.affectedRows === 1) {
          //affectedRows新增的筆數成功
          data.msg = {
            type: "success",
            info: "資料新增成功"
          };
          response.render("sales3_add", data);
        }// if end
      }); //dbquery
    }//error,results
  );//dbquery(select)
});//app.post

//刪除資料=========================================================2019/01/22
app.get("/sales3/remove/:sid", (request, response) => {
  db.query(
    "DELETE FROM `sales` WHERE `sid`=?",
    [request.params.sid], // request上方:sid的值
    (error, results, fields) => {
      response.redirect("/sales3.hbs");
    }
  );
});
//========================================================

app.get("/sales3/remove2/:sid", (request, response) => {
  //在刪除時，會透過SALES3.HBS裡面的SCRIPT設定，找到要刪除的值
  db.query(
    "DELETE FROM `sales` WHERE `sid`=?",
    [request.params.sid], //參數  //上方:sid的值會儲存後，帶入此處(為一個object)
    (error, results, fields) => {
      response.json({
        //將上方的object給得值轉為json
        success: true,
        affectedRows: results.affectedRows
      });
    }
  );
});
//=======================================================

//修改資料
app.get("/sales3/edit/:sid", (request, response) => {
  db.query(
    "SELECT * FROM `sales` WHERE `sid`=?",
    [request.params.sid], //上方:sid的值會儲存後，帶入此處(為一個object)
    (error, results, fields) => {
      //預防別人在網址後方亂輸入sid後，即可對資料做編輯，修改數字
      if (!results.length) {
        //沒有results的陣列(長度)時，代表他沒有資料，可能他是透過網址直接輸入
        response.status(404);
        response.send("No data!");
      } else {
        results[0].birthday = moment(results[0].birthday).format("YYYY-MM-DD"); //因為result結果回傳的是一個陣列，第一個值=result[0] // [{sid:xx ,sales:xxx, name:000}]
        response.render("sales3_edit", {
          item: results[0] //取得值後修改，進入sales3_edit
        });
      }
    }
  );
});

///=====================================post
app.post("/sales3/edit/:sid", (request, response) => {
  let my_result = {
    success: false, //預設值為false，才不會一開始就成功
    affectedRows: 0, //因為尚未修改，所以還不會出現affectedRows，所以=0
    info: "每一欄皆為必填欄位"
  };
  const val = {
    //取出我編輯修改後的值
    sales_id: request.body.sales_id,
    name: request.body.name,
    birthday: request.body.birthday
  };

  if (!request.body.sales_id || !request.body.name || !request.body.birthday) {
    response.json(my_result); //json格式的my_result值
    return; //格式錯誤，回傳一開始設定的my_result(success=false, affecredrow=0 ...)
  }
  //=================================================================================
  //確認修改的直都有輸入後，去資料庫找
  db.query(
    "SELECT * FROM `sales` WHERE `sales_id`= ? AND sid<> ? ", //sid<> ?  ==> sid不等於sid
    [request.body.sales_id, request.params.sid], //(我輸入的)  欄位內修改的值  ==> 會要求回傳到上方?(問號)做比對
    (error, results, fields) => {
      if (results.length) {
        my_result["info"] = "員工編號重複";
        response.json(my_result);
        return;
      }

      const sql = "UPDATE `sales` SET ? WHERE sid=?";
      db.query(sql, [val, request.params.sid], (error, results, fields) => {
        //val 就是上方post後定義的那3個
        if (error) {
          console.log(error);
          // res.send(error.sqlMessage);
          // return;
        }

        if (results.affectedRows === 1) {
          my_result = {
            success: true,
            affectedRows: 1,
            info: "修改成功"
          };
          response.json(my_result);
        } else {
          my_result["info"] = "資料沒有變更";
          responses.json(my_result);
        }
      });
    }
  );
});
///=====================================
//建立需登入後才可以看到內文的APP
// app.get("/sales4/login", (req, res) => {
//   res.send("hello /sales4/login");
// });

app.use("/sales4", require("./my_router/sales4.js"));

//===========================================

app.use((request, response) => {
  response.type("text/plain");
  response.status(404);
  response.send("Page not found.....");
});

app.listen(3003, () => {
  console.log("server start...");
});
