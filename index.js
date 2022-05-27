const express = require('express')
const app = express()
const port = process.env.PORT || 8000
var cors = require('cors')
require('dotenv').config()



// cors /json midel wire
app.use(cors())
app.use(express.json())



//  mongodb cluster connect
const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_KEY}@cluster0.mstyq.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });


async function run() {

   try{
       await client.connect()
       const collection = client.db("instructor").collection("course");
       const userscollection = client.db("Alluser").collection("users");


    //  course get from db
    app.get('/courses', async(req,res)=> {
        const coursecollection = await collection.find().toArray()
        res.send(coursecollection)
    })
    // courrse get end here


    //  user collection make 
    app.put('/usercollection/:email',async(req,res)=> {
        const email = req.params.email;
        const user = req.body
        const filter = {email:email}
        const options = { upsert: true };
        const updateDoc = {
            $set: user
          };
        const update = await userscollection.updateOne(filter, updateDoc, options)
        res.send(update)
    })


    //  make user admin
    app.put('/users/admin/:email' , async(req,res)=>{
        const email = req.params.email ;
        const requester = req.params.email;
        const seacrh = await userscollection.findOne({email: requester }) 
        if(seacrh.role === 'admin'){
            const filter = {email: email}
            const updateDoc = {
                $set: {role : "admin"}
              };
              const makeadmin = await userscollection.updateOne(filter, updateDoc)
              res.send(makeadmin)
        }
        else{
            res.status(401).send({meassage : "cannot make admin" })
        }
       
    } )



    // app.put('/users/admin/:email' , async(req,res)=> {
    //     const email = req.params.email ;
    //     const filter = {email: email}
    //     const updateDoc = {
    //         $set: {role : "admin"}
    //       };
    //       const result = await userscollection.updateOne(filter, updateDoc)
    //       res.send(result)
    // } )


      // load all user who are sign in our page
      app.get('/users' , async(req,res) =>{
          const result = await userscollection.find().toArray()
          res.send(result)
      }) 



   }
   finally{

   }



}
run().catch(console.dir);


//  cluster mongodb testing key
// client.connect(err => {
//   const collection = client.db("test").collection("devices");
//   // perform actions on the collection object
//   console.log("connect from here db");
//   client.close();
// });


app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})