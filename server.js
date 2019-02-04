const express = require('express')
const app = express()
const bodyParser = require('body-parser')
const mongo = require('mongodb')
const cors = require('cors')
const moment = require('moment')

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


function findUserNameById(id,done){
User.find({_id: id},(err,data)=>{
  if (err) return done(err.stack);
  return done(null,data);
});
}
  
app.post("/api/exercise/add", function (req, res) {
  
  let date = req.body.date;
  
  /*handling invalid date entry by setting the invalid date to current date. 
  To set at 'Invalid date' instead, just remove the 2nd condition below
  date === 'Invalid date' to just store invalid date
  */
  
  date = moment(date, 'YYYY-MM-DD', true).format('YYYY-MM-DD');
  
  if (!req.body.date || date === 'Invalid date') {
   date = moment().format('YYYY-MM-DD');
  }
  
  var addExercise = new Exercise({
    userId: req.body.userId,
    exerciseDescription: req.body.description,  
    minExerciseDuration: req.body.duration,
    exerciseDate: date
  });
  addExercise.save(function (err, data) {
    if (err) return (err.stack);
    //set values based on what successfully saved to Mongo
    
    let userId = data.userId;
    let description = data.exerciseDescription;
    let duration = data.minExerciseDuration;
    let date = data.exerciseDate;
    
    findUserNameById(data.userId,(err, data)=>{
    //note to self: when calling this function, make sure you pass both params err and data, without err was returning null
    res.json({"username": data[0].username,
              "_id": userId,
              "description": description,
              "duration": duration,
              "date": date
             });
    
    });
    
    })
});

app.get("/api/exercise/users", function (req, res) {
  
  User.find((err,data)=>{
    
  if (err) return (err.stack);
    
    res.json(data); 
    return (null,data);
  
  })
  
});

app.get("/api/exercise/log", function (req, res) {
  
  let fromToSearch;
  let toToSearch;
  let limitToSearch;
  let exerciseCount;
  
  let userIdToSearch = req.query.userId; //requirements do not specify need for error handling on invalid Id
  
if(req.query.from) fromToSearch = req.query.from;
if(req.query.to) toToSearch = req.query.to;
if(req.query.limit) limitToSearch = parseInt(req.query.limit);
  
  //if the user does not specify the optional query fields, from, to, or limit, assume no min or no max respectively, so as to catch all possible values in the filter
    if(fromToSearch == undefined) fromToSearch = '0000-00-00';
    if(toToSearch == undefined) toToSearch = '9999-99-99';
    if(limitToSearch == undefined) limitToSearch = 9999; //arbitrarily set a theoretical maximum
  
  Exercise.countDocuments(
    {userId: userIdToSearch}).where("exerciseDate").gte(fromToSearch).lte(toToSearch).limit(limitToSearch).exec((err, count) => {
      if (err) return (err, count);
    exerciseCount = count;
  });
  
  Exercise.find(
    {userId: userIdToSearch}).where("exerciseDate").gte(fromToSearch).lte(toToSearch).limit(limitToSearch).exec((err, data) => {
      if (err) return (err, data);
    
    let exerciseLog = [];//for users with no exercises logged, will return this empty array when the endpoint is hit for their Id
    
    for(let i = 0; i < data.length; i++){
     exerciseLog.push({
       "description": data[i].exerciseDescription, 
       "duration": data[i].minExerciseDuration, 
       "date": data[i].exerciseDate
     }); 
    }
    
    findUserNameById(userIdToSearch,(err, data)=>{
    
      res.json({
        "_id": userIdToSearch,
      "username": data[0].username,
      "count": exerciseCount,
      "log": exerciseLog});
      
      
  });
    
    
    
      return (null, data);
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
