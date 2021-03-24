const express = require('express');
const app = express();
const generateUUId = require('unique-identifier');
const cors = require('cors');
const Database = require("@replit/database");

require('dotenv').config();

app.use(cors());
app.use(express.static('public'));
app.use(express.urlencoded({limit: '50mb', extended: true}));
app.use(express.json({limit: '50mb'}));
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});


const db = new Database()
//erase db
db.list().then(function (keys){
  keys.forEach(function(key){
    db.delete(key);
  });
});

app.post('/api/exercise/new-user',(req, res) => {
  if (req.body.username)
  {
  let id=generateUUId();
   let element={_id:id,username:req.body.username,log:[]};
  db.set(id, JSON.stringify(element)).then(() => {
      res.json({_id:id,username:req.body.username});
  });
  }
  else
  res.json({msg:"username not present."});
});




app.get('/api/exercise/users', (req, res) => {
  db.list().then(keys => {
    let ret=[];
    keys.forEach(function(element){
      db.get(element).then(value => {
        let tmp=JSON.parse(value);
        ret.push({_id:element,username:tmp.username});
      });
    });
     setTimeout(function(){
    res.json(ret);},1000);
  });
})

app.post('/api/exercise/add',(req, res) => {
  if (req.body.userId || req.body.description || req.body.duration)
  {
    try
    {
  let element={
    duration:req.body.duration,
    description:req.body.description,
    date:Date.parse(req.body.date) || Date.now()
  };
  db.get(req.body.userId).then(value => {
      if (value)
      {
        let tmp=JSON.parse(value);
        tmp.log.push(element);
        db.set(req.body.userId, JSON.stringify(tmp)).then(() => {
          res.json({username:tmp.username,description:element.description,duration:parseInt(element.duration),_id:req.body.userId,date:(new Date(element.date)).toDateString()});
        });
      }
      else
      {
      res.json({msg:"userid does not exist"});  
      }
    });

    }
    catch
    {
  res.json({msg:"date format wrong"});

    }
  
  }
  else
  res.json({msg:"userid or description or duration not present."});
});

app.get('/api/exercise/log',(req, res) => {
  if (req.query.userId)
  {
    db.get(req.query.userId).then(value => {
      if (value)
      {
        let tmp=JSON.parse(value);
        if (req.query.from)
        {
          try
          {
            var from=Date.parse(req.query.from);
            tmp.log = tmp.log.filter(i => i.date >=from);
          }
          catch
          {
            res.json({msg:"from date error"});    
          }
        }
      
      if (req.query.to)
        {
          try
          {
            var to=Date.parse(req.query.to);
            tmp.log = tmp.log.filter(i => i.date <=to);
          }
          catch
          {
            res.json({msg:"to date error"});    
          }
        }
  
        if (req.query.limit)
        {
          tmp.log=tmp.log.slice(0,req.query.limit);
        }

        tmp.count=tmp.log.length;
        res.json(tmp);
      }
      else
      {
        res.json({msg:"userid does not exist"});    
      }
    });
  }
  else
  {
    let ret=0;
    db.list().then(keys => {
      keys.forEach(function(element){
         db.get(element).then(value => {
        let tmp=JSON.parse(value);
        ret+=tmp.log.length;
      });
      })
      
       setTimeout(function(){
    res.json({count:ret});},1000);
    });
  }
})



const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
