const express = require('express');
const cors = require('cors');
require('./db/config'); 
const User = require('./db/User');
const Product = require('./db/Product');
const Jwt = require('jsonwebtoken');
require('dotenv').config();


//jwt key
const jwtKey = process.env.JWT_KEY;

const app = express();

//middleware used to controll POST req
app.use(express.json());
//middleware used to controll cors
app.use(cors());

//make a route/ register api
app.post("/register", async (req,resp)=>{
    if(req.body.name && req.body.password && req.body.email) //[M]
    {
        //this is use bcz in DB multiple data have same value, so before enter the data must be checke [M]
        let checkDataBeforeInsert = await User.findOne(req.body) //[M]
        
        if(checkDataBeforeInsert)//[M]
        {
            // alert("Already exist this data");
            resp.send({result: "Already exist"});//[M]
        }
        else//[M]
        {
            let user = new User(req.body); //this is signup, so here we create new user
            let result = await user.save();
            // resp.send(result); 
            //Here we dont want to show password 
            result = result.toObject(); // JSON data convert in object format
            delete result.password; //this is js object operator
            // resp.send(result); //This will show data in client side
            Jwt.sign({result}, jwtKey, (err, token) => {
                if(err){
                    resp.send({result: "something went wrong, please try after some time"});
                }
                resp.send({result, auth: token});
            })
        }
    }
    else //[M]
    {
        resp.send({result: "Please fill the form"}); //[M]
    }
})

//make a route/ login api
app.post("/login", async (req,resp)=>{
    if(req.body.password && req.body.email)
    {
        let user = await User.findOne(req.body).select("-password"); //here match the data in db, which is given by user
        if(user)
        {
            // add jwt token
            Jwt.sign({user}, jwtKey, (err, token) => {
                if(err){
                    resp.send({result: "something went wrong, please try after some time"});
                }
                resp.send({user, auth: token});
            })
            // Jwt.sign({user}, jwtKey, {expiresIn: "2h"}, (err, token) => {
            //     if(err){
            //         resp.send({result: "something went wrong, please try after some time"});
            //     }
            //     resp.send({user, auth: token});
            // })
             
        }
        else
        {
           resp.send({result: "No user found"});
        }
    }
    else
    {
        resp.send({result: "No user data found"});
    }
})


//make a route/ product api
app.post('/add-product', verifyToken,  async (req, resp)=>{
    // resp.send("product");
    let product = new Product(req.body); //here we add products, thats why write this way with new keyword and schrma name which is import here
    let result = await product.save(); //bcz we want to save product data in db
    resp.send(result); 
})


//make a route/ product-List api, here we only get the all products
app.get('/products', verifyToken, async (req, resp)=>{
    // resp.send("all products");
    let products = await Product.find();
    //only show if DB has item, if in DB has no item then see else part
    if(products.length>0)
    {
        resp.send(products);
    }
    else
    {
        resp.send({result: "No products found"})
    }
})

//make a route/ delete product api, here we delete products from frontend, and take that specific product id from api URL which I want to delete
app.delete("/product/:id", verifyToken, async (req, resp)=>{
    //  resp.send(req.params.id);
    const result = await Product.deleteOne({_id:req.params.id});
    // console.log(result)
    resp.send(result);
})


//API for get single product
app.get('/product/:id', verifyToken, async (req, resp)=>{
    //here we want onlyone specific data
   let result = await Product.findOne({_id:req.params.id});
   //it may be possible we send wrong id and we dont get any result
   if(result)
   {
      resp.send(result);
   }
   else
   {
    resp.send({result: "No record found."});
   }
  
})


// Update api
app.put('/updateProduct/:id', verifyToken, async (req, resp)=>{
      let result = await Product.updateOne(
        {_id:req.params.id},
        {
            $set : req.body
        }
    )
    resp.send(result);
})


//search api + add middleware also
app.get('/search/:key', verifyToken, async (req, resp)=>{
   let result = await Product.find({
    // if we want to search with multiple data like name , category, price etc
      "$or": [
        {name:{$regex:req.params.key}},
        {company:{$regex:req.params.key}},
        {price:{$regex:req.params.key}},
        {category:{$regex:req.params.key}}
      ]
   })
   resp.send(result);
})


//make middleware function to verify token and in middleware function take 3 parameter
function verifyToken(req,resp,next){
    //by this we get the token 
    let token = req.headers['authorization'];
    if(token){
      //now we know bearer and token seperated by space, now I want to get only token part, not bearer part, so split them
      token = token.split(' ')[1]; //return in arr format
    //   console.log('middleware called it', token);
      //now verify token
      Jwt.verify(token, jwtKey, (err, valid)=>{
        if(err)
        {
            //here I change the status, when invalid token came send 401
            resp.status(401).send({result: "Please provide valid token"})
        }
        else
        {
            //next() means all are ok, move forward
            next();
        }
      })
    }
    else
    {
        //if there is no token
        resp.status(403).send({result: "Please add token with header"})
    }
}



// const connectDB = async ()=>{
//     mongoose.connect("mongodb://127.0.0.1:27017/e-comm");
//     // mongoose.connect('mongodb://localhost:27017/e-comm');
//     // now create schemas (only create if you use inser/update/delete. For get the data dont need to create this)
//     const productSchema = new mongoose.Schema({});
//     //create model
//     const product = mongoose.model('products', productSchema);
//     // fetch data to db we use it
//     const data = await product.find();
//     console.warn(data);

// }

// connectDB();

app.listen(5000);