const express = require('express')
const app = express()
const port = process.env.PORT || 8000
var cors = require('cors')
require('dotenv').config()
var jwt = require('jsonwebtoken');


// cors /json midel wire
app.use(cors())
app.use(express.json())



//  mongodb cluster connect
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_KEY}@cluster0.mstyq.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });


// const verifyjwt

const verifyjwt = (req, res, next) => {
  const auth = req.headers.authorization
  if (!auth) {
    return res.status(403).send({ message: "unauthorized access" })
  }
  const token = auth.split(' ')[1]
  console.log(token);
  jwt.verify(token, process.env.JWT_KEY, function (err, decoded) {
    if (err) {
      return res.status(401).send({ message: "forbidden access" })
    }
    console.log("decoded", decoded);
    req.decoded = decoded
  })


  console.log("sdfdf");
  next()
}



async function run() {

  try {
    await client.connect()
    const collection = client.db("instructor").collection("course");
    const userscollection = client.db("Alluser").collection("users");
    const courses = client.db("Courses").collection("course");
    const Review = client.db("Review").collection("Reviews");



    //  course get from db
    // app.get('/courses', async(req,res)=> {
    //   const page = parseInt(req.query.page );
    //   const size = parseInt(req.query.size) ;
    //   console.log(size , page);
    //   let coursecollection ;
    //   if(page || size){
    //     coursecollection = await collection.find().skip(page*size).limit(size).toArray()
    //   }

    //   else{

    //     coursecollection = await collection.find().toArray()
    //    res.send(coursecollection)

    //   }
    // })

    // courses get from db and page size wise data show 
    app.get('/courses', async (req, res) => {
      const query = {}
      const cursor = collection.find(query)
      const page = parseInt(req.query.page);
      const size = parseInt(req.query.size);
      let result
      if (page || size) {
        result = await cursor.skip(page * size).limit(size).toArray()
      }

      else {
        result = await cursor.toArray()
      }

      res.send(result)
    })



    // courses pagenation api making here
    app.get('/counts', async (req, res) => {
      const coursescounts = await collection.estimatedDocumentCount()
      res.send({ coursescounts })
    })



    //  user collection make 
    app.put('/usercollection/:email', async (req, res) => {
      const email = req.params.email;
      const user = req.body
      const filter = { email: email }
      const options = { upsert: true };
      const updateDoc = {
        $set: user
      };
      const update = await userscollection.updateOne(filter, updateDoc, options)
      const token = jwt.sign({ email: email }, process.env.JWT_KEY, 
        { expiresIn: '30d' });
      res.send({ update, token })
    })


    // load all user who are sign in our page
    app.get('/users', async (req, res) => {
      const result = await userscollection.find().toArray()
      res.send(result)
    })

    //  make user admin / a admin can make admin only
    app.put('/users/admin/:email', verifyjwt, async (req, res) => {
      const email = req.params.email;
      const requester = req.decoded.email;
      const requesteremail = await userscollection.findOne({ email: requester })
      if (requesteremail.role === "admin") {
        const filter = { email: email }
        const updateDoc = {
          $set: { role: "admin" }
        };
        const makeadmin = await userscollection.updateOne(filter, updateDoc)
        res.send(makeadmin)
      }
      else {
        res.status(403).send({ message: "unauthorized" })
      }


    })

    // course get from client site store in db
    app.post('/courseend', verifyjwt, async (req, res) => {
      const course = req.body
      const coursestore = await collection.insertOne(course)
      res.send(coursestore)
    })

    // user profile get from client side user profile section
    app.put('/profiles/:email', async (req, res) => {
      const info = req.body
      const email = req.params.email;
      const filter = { email: email }
      const options = { upsert: true };
      const updateDoc = {
        $set: info
      };
      const userinfostore = await userscollection.updateOne(filter, updateDoc, options)
      res.send(userinfostore)
    })

    // user info get/show client side user wise
    app.get('/userdata', async (req, res) => {
      const email = req.query.email;
      const query = { email: email }
      const userdetails = await userscollection.findOne(query)
      res.send(userdetails)
    })

    // delete courses 
    app.delete('/delete/:id', async (req, res) => {
      const id = req.params.id
      const filter = { _id: ObjectId(id) }
      const course = await collection.deleteOne(filter)
      res.send(course)
    })


    // get user review
    //  app.put('/review/:id' ,async(req,res) => {
    //    const id = req.params.id;
    //    console.log(id);
    //    const star = req.body
    //    console.log(star);
    //    const filter = {_id: ObjectId(id)}
    //    const options = { upsert: true };
    //    const updateDoc = {
    //     $set: star
    //   };
    //   const coursestar = await collection.updateOne(filter, updateDoc, options)
    //   res.send(coursestar)
    //  }) 


    // id wisecourse get
    app.get('/singelcourse/:id', async(req,res)=> {
      const id = req.params.id ;
      const query = {_id:ObjectId(id)}
      const course = await collection.findOne(query)
      res.send(course)
    } )


  //  courses send in db checkout page api
      app.post('/checkout' , async(req,res)=> {
        const course = req.body ;
        const storeindb = await courses.insertOne(course)
        res.send(storeindb)
      })

      
      // user wise courses/ ordeer user wise my course section
       app.get('/mycourse', verifyjwt, async(req,res)=> {
         const email = req.query.email ;
         console.log(email);
         const decoded = req.decoded.email;
      
       
         if(email === decoded){
           const query = {email : email}
       
           const mycourse = await courses.find(query).toArray()
           res.send(mycourse)
         }
         else{
           return res.status(403).send({message : "unauthorizes access"})
         }
       } )


       app.get('/mycourse' ,  async(req,res)=> {
         const course = await courses.find().toArray()
         res.send(course)
       })

    //  review api making
      app.post('/review', async(req,res)=> {
        const review = req.body;
        console.log(review);
        const storereview = await Review.insertOne(review)
        res.send(storereview)
      } )
  




  }
  finally {

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