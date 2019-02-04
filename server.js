const express = require('express')
const app = express()
const bodyParser = require('body-parser')
const mongo = require('mongodb')
const cors = require('cors')

const mongoose = require('mongoose')
mongoose.connect(process.env.MLAB_URI || 'mongodb://localhost/exercise-track',{ useNewUrlParser: true } )

//creat the schema

var Schema = mongoose.Schema;

var userModel = new Schema({
    username: {type: String, required: true},
  });

var exerciseModel = new Schema({
    userId: {type: String, required: true},
    exerciseDescription: {type: String, required: true},
    minExerciseDuration: {type: String, required: true},
    exerciseDate: String
  });

var User = mongoose.model('User', userModel);

var Exercise = mongoose.model('Exercise', exerciseModel);

app.use(cors())

app.use(bodyParser.urlencoded({extended: false}))
app.use(bodyParser.json())


app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});


/* function to find username by ID
User.find({id goes here}(err,data)=>{
    
    console.log(data);
    
  if (err) return (err.stack);
    
    res.json(data); 
    return (null,data);
  
  })*/
  


app.post("/api/exercise/add", function (req, res) {
  
  let date = req.body.date;
  
  if (!req.body.date) {
    date = new Date();
   //date = date.getFullYear() + "-" + (1 + date.getMonth()) + "-" + date.getDate();
  }
  
  var addExercise = new Exercise({
    userId: req.body.userId,
    exerciseDescription: req.body.description,  
    minExerciseDuration: req.body.duration,
    exerciseDate: date
  });
  addExercise.save(function (err, data) {
    if (err) return (err.stack);
    //find username using function, returns username where TBD sits
    
    res.json({"username": "TBD",
              "_id": data.userId,
              "description": data.exerciseDescription,
              "duration": data.minExerciseDuration,
              "date": data.exerciseDate
             }); 
    return (null,data);
    })
});

app.get("/api/exercise/users", function (req, res) {
  
  User.find((err,data)=>{
    
    console.log(data);
    
  if (err) return (err.stack);
    
    res.json(data); 
    return (null,data);
  
  })
  
});

app.post("/api/exercise/new-user/",function(req,res){
  
var addUser = new User({username: req.body.username});
  addUser.save(function (err, data) {
    if (err) return (err.stack);
    
    res.json({"username": data.username,
            "_id": data._id}); 
    return (null,data);
    })
});






// Not found middleware
app.use((req, res, next) => {
  return next({status: 404, message: 'not found'})
})

// Error Handling middleware
app.use((err, req, res, next) => {
  let errCode, errMessage

  if (err.errors) {
    // mongoose validation error
    errCode = 400 // bad request
    const keys = Object.keys(err.errors)
    // report the first validation error
    errMessage = err.errors[keys[0]].message
  } else {
    // generic or custom error
    errCode = err.status || 500
    errMessage = err.message || 'Internal Server Error'
  }
  res.status(errCode).type('txt')
    .send(errMessage)
})

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
