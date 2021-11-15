const express = require('express');
const { MongoClient } = require('mongodb');
const cors = require('cors');
const admin = require("firebase-admin");
const ObjectId = require('mongodb').ObjectId;
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

//middleware
app.use(cors());
app.use(express.json());

//drone-beyond-firebase-adminsdk

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.93dpr.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
// console.log(uri);
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

async function verifyToken(req, res, next) {
    //console.log('put',req.headers);
    if (req.headers?.authorization?.startsWith('Bearer ')) {//check the token that startwith Bearer
        const token = req.headers.authorization.split(' ')[1];//divide the token into two array

        try {
            const decodedUser = await admin.auth().verifyIdToken(token);
            req.decodedEmail = decodedUser.email;
        }
        catch {

        }

    }
    next();
}
async function run(){
    try
    {
        await client.connect();
        // console.log('connection successfull');
        const database = client.db('droneBeyond');
        const ordersCollection = database.collection('orders');
        const usersCollection = database.collection('users');
        const productsCollection = database.collection('products');

        app.get('/orders', async(req, res)=>{
            const email = req.query.email;
            const query = { email: email }
            const cursor = ordersCollection.find(query);
            const orders = await cursor.toArray();
            res.json(orders);
        })

        app.post('/order', async(req, res)=>{
            const order = req.body;
            const result = await ordersCollection.insertOne(order);
            console.log(result);
            res.json(result)
        });

        app.post('/product', async(req, res)=>{
            const product = req.body;
            const result = await productsCollection.insertOne(product);
            console.log(result);
            res.json(result)
        });

        //GET API  
        app.get('/products', async(req, res) => {
            const cursor = productsCollection.find({});
            const products = await cursor.toArray();
            res.send(products);
        });

        //DELETE API
        app.delete('/product/:id', async (req, res) =>{
            const id = req.params.id;
            console.log(id);
            const query = {_id: ObjectId(id)};
            const result = await productsCollection.deleteOne(query);
    
            console.log("deleting product id", result);
    
            res.json(result);
        });

        app.post('/users', async(req, res)=>{
            const user = req.body;
            const result = await usersCollection.insertOne(user);
            console.log(result);
            res.json(result);
        });

        app.put('/users', async(req, res)=>{
            const user = req.body;
            const filter = { email: user.email };
            const options = { upsert: true };
            const updateDoc = { $set: user };
            const result = await usersCollection.updateOne(filter, updateDoc, options);
            res.json(result);
        });

        app.get('/users/:email', async(req, res)=>{
            const email = req.params.email;
            const query = { email: email};
            const user = await usersCollection.findOne(query);
            let isAdmin = false;
            if (user?.role === 'admin') {
                isAdmin = true;
            }
            res.json({ admin: isAdmin });
        })

        app.put('/users/admin', verifyToken, async(req, res)=>{
            const user = req.body;
            //console.log('put',req.headers);
            //npm install firebase-admin --save run this command
            const requester = req.decodedEmail;
            if (requester) {
                const requesterAccount = await usersCollection.findOne({ email: requester });//find the email in database
                if (requesterAccount.role === 'admin') {//check the user role is admin
                    const filter = { email: user.email };
                    const updateDoc = { $set: { role: 'admin' } };//set role as admin to database
                    const result = await usersCollection.updateOne(filter, updateDoc);//updata data in database
                    res.json(result);
                }
            }
            else {
                res.status(403).json({ message: 'you do not have access to make admin' })
            }
        })
    }
    finally
    {
        // await client.close();
    }
}
run().catch(console.dir);

app.get('/', (req, res) => {
    res.send('Drone Beyond Server is Running!')
  })
  
  app.listen(port, () => {
    console.log(`Drone Beyond Server listening at http://localhost:${port}`)
  })