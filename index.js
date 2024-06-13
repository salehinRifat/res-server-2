const express = require('express')
const app = express()
require('dotenv').config()
var jwt = require('jsonwebtoken');
// Parse the body
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//Middlewires
const cors = require('cors');
app.use(cors());
const port = process.env.PORT || 5000;



const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@salehinrifat1.7tmx0zj.mongodb.net/?retryWrites=true&w=majority&appName=salehinrifat1`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        const menuCollection = client.db("RestauDB").collection("menu");
        const reviewsCollection = client.db("RestauDB").collection("reviews");
        const cartCollection = client.db("RestauDB").collection("cart");
        const userCollection = client.db("RestauDB").collection("users");
        // Token Related API
        app.post('/jwt', async (req, res) => {
            const user = req.body;
            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRETS, { expiresIn: '1h' });
            res.send({ token });
        })
        //Middlewares
        const verifyToken = (req, res, next) => {
            if (!req.headers.authorization) {
                res.status(401).send({ message: "Forbidden Access" });
            }
            const token = req.headers.authorization.split(' ')[1];
        }
        // Menu 
        app.get('/menu', async (req, res) => {
            const result = await menuCollection.find().toArray();
            res.send(result);
        })
        // Reviews
        app.get('/reviews', async (req, res) => {
            const result = await reviewsCollection.find().toArray();
            res.send(result);
        })
        // Carts operations
        app.post('/carts', async (req, res) => {
            const cartItem = req.body;
            const result = await cartCollection.insertOne(cartItem);
            res.send(result);
        })
        app.get('/carts', async (req, res) => {
            const email = req.query.email;
            const query = { email: email };
            const result = await cartCollection.find(query).toArray();
            res.send(result);
        })
        app.delete('/carts/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await cartCollection.deleteOne(query);
            res.send(result);
        })
        // Manage Users
        app.get('/users', verifyToken, async (req, res) => {

            const result = await userCollection.find().toArray();
            res.send(result);
        })
        app.patch('/users/admin/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const updatedInfo = {
                $set: {
                    role: 'admin'
                }
            }
            const result = await userCollection.updateOne(query, updatedInfo);
            res.send(result);
        })
        app.delete('/users/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await userCollection.deleteOne(query);
            res.send(result);
        })
        app.post('/users', async (req, res) => {
            const userInfo = req.body;
            const query = { email: userInfo.email };
            const existingUser = await userCollection.findOne(query);
            if (existingUser) {
                return res.send({ message: 'User already exists' })
            }
            const result = await userCollection.insertOne(userInfo);
            res.send(result);
        })
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();
        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);


app.get('/', (req, res) => {
    res.send('Hello World!')
})

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})