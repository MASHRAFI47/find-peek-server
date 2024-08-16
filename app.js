const express = require("express");
const app = express();

require("dotenv").config();

//cors
const cors = require("cors");
app.use(cors());

//form
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.iduz7rm.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

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
        // Connect the client to the server	(optional starting in v4.7)
        // await client.connect();
        const productsCollection = client.db("findPeek").collection("products");

        app.get('/products', async (req, res) => {
            const filter = req.query;
            console.log(filter)
            const query = {
                price: { $lt: 200 },
                productName: { $regex: filter.search, $options: 'i' },
                category: { $regex: filter.category, $options: 'i' },
            }
            const options = {
                sort: {
                    price: filter.sort === 'asc' ? 1 : -1,
                }
            };
            const cursor = productsCollection.find(query, options);
            const result = await cursor.toArray();
            res.send(result);
        })

        //get all products data from db for pagination
        app.get('/products-data', async(req, res) => {
            const result = await productsCollection.find().toArray();
            res.send(result);
        })

        //get all products count from db for pagination
        app.get('/products-count', async(req, res) => {
            const result = await productsCollection.find().toArray();
            res.send(result);
        })

        // app.get('/products', async (req, res) => {
        //     const result = await productsCollection.find().toArray();
        //     res.send(result);
        // })

        app.post('/products', async (req, res) => {
            const product = req.body;
            const result = await productsCollection.insertOne(product);
            res.send(result);
        })

        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);


app.get('/', async (req, res) => {
    res.send("Find Peek server is running");
})



module.exports = app;