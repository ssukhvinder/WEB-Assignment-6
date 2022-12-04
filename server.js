const authData = require('./auth-service.js')
const exphbs = require('express-handlebars');
const express = require('express');
const productData = require("./product-service");
const multer = require("multer");
const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');
const path = require("path");
const app = express();
const clientSessions = require("client-sessions");
const HTTP_PORT = process.env.PORT || 8080;

cloudinary.config({
  cloud_name: 'dsomaqrqy',
  api_key: '781542918267494',
  api_secret: 'kPhMaI8LHY8oHsWM6R3Lquh4Zgs',
      secure: true
  });


const upload = multer();




app.use(express.static('public'));

app.engine('.hbs', exphbs({ 
    extname: ".hbs", 
    defaultLayout: "main",
    helpers: {
        navLink: function(url, options){
            return '<li' + 
                ((url == app.locals.activeRoute) ? ' class="active" ' : '') + '><a href="' + url + '">' + options.fn(this) + '</a></li>'; },
        equal: function (lvalue, rvalue, options) {
            if (arguments.length < 3)
                throw new Error("Handlebars Helper equal needs 2 parameters");
            if (lvalue != rvalue) {
                return options.inverse(this);
            } else {
                return options.fn(this);
            }
        }           
    } 
}));
app.set('view engine', '.hbs');

// client sessions
app.use(clientSessions({
    cookieName: "session", 
    secret: "this_is_some_super_secret_string_for_web322_assignment6", 
    duration: 2 * 60 * 1000, // 2 minutes
    activeDuration: 1000 * 60 // 1 minute
}));

app.use(function(req, res, next) {
    res.locals.session = req.session;
    next();
});


// add middleware for the helper function
app.use(function(req,res,next) {
    let route = req.baseUrl + req.path;
    app.locals.activeRoute = (route == "/") ? "/" : route.replace(/\/$/, "");
    next();
});

// middleware function to check if the user is logged in
function ensureLogin(req, res, next) {
    if (!req.session.user) {
        res.redirect("/login");
    } else {
        next();
    }
}

app.use(function(req,res,next){
    let route = req.path.substring(1);
app.locals.activeRoute = "/" + (isNaN(route.split('/')[1]) ?route.replace(/\/(?!.*)/, "") :route.replace(/\/(.*)/, ""));
app.locals.viewingCategory = req.query.category;
next();
});

app.get('/', (req, res) => {
    res.render(path.join(__dirname, "/views/home.hbs"))
});

app.get('/product', async (req, res) => {

    // Declare an object to store properties for the view
    let viewData = {};

    try{

        // declare an empty array to hold "product" objects
        let products = [];

        // if there's a "category" query, filter the returned products by the category
        if(req.query.category){
            // Obtain the published "products" by category
            products = await productData.getPublishedProductsByCategory(req.query.category);
        }else{
            // Obtain the published "products"
            products = await productData.getPublishedProducts();
        }

        // sort the published products by the postDate
        products.sort((a,b) => new Date(b.postDate) - new Date(a.postDate));

        // get the latest product from the front of the list (element 0)
        let product = products[0]; 

        // store the "products" and "product" data in the viewData object (to be passed to the view)
        viewData.products = products;
        viewData.product = product;

    }catch(err){
        viewData.message = "no results";
    }

    try{
        // Obtain the full list of "categories"
        let categories = await productData.getCategories();

        // store the "categories" data in the viewData object (to be passed to the view)
        viewData.categories = categories;
    }catch(err){
        viewData.categoriesMessage = "no results"
    }

    // render the "product" view with all of the data (viewData)
    res.render("product", {data: viewData})

});
app.get('/demo', ensureLogin, (req,res)=>{

    let queryPromise = null;

    if(req.query.category){
        queryPromise = productData.getProductsByCategory(req.query.category);
    }else if(req.query.minDate){
        queryPromise = productData.getProductsByMinDate(req.query.minDate);
    }else{
        queryPromise = productData.getAllProducts()
    } 

    queryPromise.then(data=>{
        if(data.length > 0) {
        res.render("demos",{demos:data});
        }
        else 
        res.render('demos', { message: "no results" });
    }).catch(err=>{
        res.render("demos",{message:"no results"});

    })

});


app.get('/category', ensureLogin, (req,res)=>{
    productData.getCategories().then((data=>{
        if(data.length > 0){
        res.render("categories",{categories:data});
        }
        else 
        res.render('categories', { message: "no results" });
    })).catch(error=>{
        res.render("categories",{message:"no results"});
    });
});

app.post("/products/add", ensureLogin ,upload.single("featureImage"), (req,res)=>{

    if(req.file){
        let streamUpload = (req) => {
            return new Promise((resolve, reject) => {
                let stream = cloudinary.uploader.upload_stream(
                    (error, result) => {
                        if (result) {
                            resolve(result);
                        } else {
                            reject(error);
                        }
                    }
                );
    
                streamifier.createReadStream(req.file.buffer).pipe(stream);
            });
        };
    
        async function upload(req) {
            let result = await streamUpload(req);
            console.log(result);
            return result;
        }
    
        upload(req).then((uploaded)=>{
            processProduct(uploaded.url);
        });
    }else{
        processProduct("");
    }

    function processProduct(imageUrl){
        req.body.featureImage = imageUrl;

        productData.addProduct(req.body).then(product=>{
            res.redirect("/demos");
        }).catch(err=>{
            res.status(500).send(err);
        })
    }   
});

app.get("/products/add",ensureLogin, (req, res) => {


    productService.getCategories()
        .then((data) => {
            res.render("addProduct", { categories: data });
        })
        .catch((err) => {
            res.render("addProduct", { categories: [] });
        })

})

app.get('/product/:id', ensureLogin ,async (req, res) => {

    // Declare an object to store properties for the view
    let viewData = {};

    try{

        // declare an empty array to hold "product" objects
        let products = [];

        // if there's a "category" query, filter the returned products by the category
        if(req.query.category){
            // Obtain the published "products" by category
            products = await productData.getPublishedProductsByCategory(req.query.category);
        }else{
            // Obtain the published "products"
            products = await productData.getPublishedProducts();
        }

        // sort the published products by postDate
        products.sort((a,b) => new Date(b.postDate) - new Date(a.postDate));

        // store the "products" and "product" data in the viewData object (to be passed to the view)
        viewData.products = products;

    }catch(err){
        viewData.message = "no results";
    }

    try{
        // Obtain the product by "id"
        viewData.product = await productData.getProductById(req.params.id);
    }catch(err){
        viewData.message = "no results"; 
    }

    try{
        // Obtain the full list of "categories"
        let categories = await productData.getCategories();

        // store the "categories" data in the viewData object (to be passed to the view)
        viewData.categories = categories;
    }catch(err){
        viewData.categoriesMessage = "no results"
    }

    // render the "product" view with all of the data (viewData)
    res.render("product", {data: viewData})
});


app.get("/categories/add",ensureLogin, (req, res) => {
   res.render("addCategory");
});

add.post("/categories/add", ensureLogin  ,function (req, res) {
    productService.addCategory(req.body)
         .then((data) => {
            res.redirect("/categories");
         })
         .catch((err) => {
            res.json(err);
         })

});


app.get("/categories/delete/:id", ensureLogin , (req, res) => {
    productService.deleteCategoryById(req.params.id)
        .then((data) => {
            res.redirect("/categories");
        })
        .catch((err) => {
            res.status(500).send("Unable to Remove Category / Category not found");
        })
});

app.get("/products/delete/:id", ensureLogin,  (req, res) => {
    productService.deleteProductById(req.params.id)
        .then((data) => {
            res.redirect("/products");
        })
        .catch((err) => {
            res.status(500).send("Unable to Remove Products / Product not found");
        })
});

app.get("/demos/delete/:id", ensureLogin , (req, res) => {
    dataService.deleteProductById(req.params.id)
        .then((data) => {
            res.redirect("/demos");
        })
        .catch((err) => {
            res.status(500).send("Unable to Remove Product / Product not found");
        })
});

// route for login page
app.get("/login", function(req, res) {
    res.render('login');
});

// route for registration page
app.get("/register", function(req, res) { 
    res.render('register');
});

// post for /register
app.post("/register", function(req, res) {
    serviceAuth.registerUser(req.body)
    .then(() => res.render('register', { successMsg: "User created!"}))
    .catch((err) => res.render('register', { errorMsg: err, userName: req.body.userName }));
});

// post for /login
app.post("/login", function(req, res) {
    req.body.userAgent = req.get('User-Agent');

    authData.checkUser(req.body)
    .then(function(user) { 
        req.session.user = {
            userName: user.userName,
            email: user.email,
            loginHistory: user.loginHistory
        }

        res.redirect('/demos');
    })
    .catch(function(err) {
        console.log(err);
        res.render('login', { errorMsg: err, userName: req.body.userName });
    });
});

// logout
app.get("/logout", function(req, res) {
    req.session.reset();
    res.redirect('/');
});

// user history
app.get("/userHistory", ensureLogin, function (req, res) {
    res.render('userHistory');
}); 
app.use((req,res)=>{
    res.status(404).send("404 - Page Not Found")
})

productData.initialize()
.then(authData.initialize)
.then(function(){
app.listen(HTTP_PORT, function(){
console.log("app listening on: " + HTTP_PORT)
    });
}).catch(function(err){
console.log("unable to start server: " + err);
});
