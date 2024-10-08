const express = require("express");
const app = express();

require("dotenv").config();

//cors
const cors = require('cors');
const cookieParser = require("cookie-parser");
const jwt = require("jsonwebtoken");

const corsOptions = {
    origin: ['http://localhost:5173', 'http://localhost:5174', 'https://common-users.web.app'],
    credentials: true,
    optionsSuccessStatus: 200
}
app.use(cors(corsOptions));

//form
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//cookie
app.use(cookieParser())


//middlewares
const verifyToken = (req, res, next) => {
    const token = req.cookies?.token;
    if (!token) {
        return res.status(401).send({ message: "Unauthorized User" })
    }
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
            console.log(err)
            return res.status(401).send({ message: "Unauthorized Access" })
        }
        req.user = decoded;

        next()
    })
}


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


        // app.get('/products', async (req, res) => {
        //     const filter = req.query;
        //     console.log(filter)
        //     const query = {
        //         price: { $lt: 200 },
        //         productName: { $regex: filter.search, $options: 'i' },
        //         category: { $regex: filter.category, $options: 'i' },
        //     }
        //     const options = {
        //         sort: {
        //             price: filter.sort === 'asc' ? 1 : -1,
        //         }
        //     };
        //     const cursor = productsCollection.find(query, options);
        //     const result = await cursor.toArray();
        //     res.send(result);
        // })

        //get all products data from db for pagination
        app.get('/products-data', async (req, res) => {
            const size = parseInt(req.query.size);
            const page = parseInt(req.query.page) - 1;
            const filter = req.query.filter;
            const sort = req.query.sort;
            const search = req.query.search;
            const brand = req.query.brand;
            const min = parseInt(req.query.min);
            const max = parseInt(req.query.max);

            let query = {
                price: { $gte: min ? min : 1, $lte: max ? max : 1000000 },
                productName: { $regex: search, $options: 'i' },
            };

            if (filter) {
                query = { ...query, category: filter };
            }

            if (brand) {
                query = { ...query, brand: brand };
            }

            const options = {
                sort: {
                    price: sort === 'asc' ? 1 : -1,
                }
            };


            const result = await productsCollection.find(query, options).skip(size * page).limit(size).toArray();
            res.send(result);
        })

        //get all products count from db for pagination
        app.get('/products-count', async (req, res) => {

            const filter = req.query.filter;
            const search = req.query.search;

            let query = {
                productName: { $regex: search, $options: 'i' },
            }

            if (filter) {
                query = { ...query, category: filter };
            }

            const count = await productsCollection.countDocuments(query);
            res.send({ count });
        })

        // app.get('/products', async (req, res) => {
        //     const result = await productsCollection.find().toArray();
        //     res.send(result);
        // })

        app.get('/products', async (req, res) => {
            const result = await productsCollection.find().toArray();
            res.send(result);
        })

        app.post('/products', async (req, res) => {
            const product = req.body;
            const result = await productsCollection.insertOne(product);
            res.send(result);
        })



        //jwt
        app.post('/jwt', async (req, res) => {
            const user = req.body;
            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
                expiresIn: '365d'
            })
            res.cookie('token', token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
            }).send({ success: true })
        })

        app.post('/logout', async (req, res) => {
            const user = req.body;
            console.log('logging out', user);
            res
                .clearCookie('token', { maxAge: 0, sameSite: 'none', secure: true })
                .send({ success: true })
        })

        // Send a ping to confirm a successful connection
        // await client.db("admin").command({ ping: 1 });
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