let express = require('express');
let app = express();
let path = require('path');
let bodyParser = require('body-parser');
let MongoClient = require('mongodb').MongoClient;
let env = process.env.NODE_ENV || 'development';
const PORT = process.env.PORT || 4000;
// reading config information
let config = require('./config')[env];
let strUserName=config.database.username;
let strPassword=config.database.password;
let url="mongodb+srv://" + strUserName + ":" + strPassword +"@cluster0.khq58.mongodb.net/shalomdb?retryWrites=true&w=majority"
let db;
let jsondata;
let arrJSONData=[];


//establish Connection
MongoClient.connect(url, { useNewUrlParser: true, useUnifiedTopology: true }, function(err, client) {
   if (err) 
   	throw err
   else
   {
	db = client.db("shalomdb");
	console.log('Connected to the Database');
	//Start app only after the connection is ready
	app.listen(PORT);
   }
 });

app.use(bodyParser.json({limit: '25mb'}))

// route to get the saved contents data
app.get('/contents', function(req, res) {
	try {
	db.collection("contents").find().toArray( function(err, record) {
		if(err) 
		  {			
			res.status(500).send({ "status": "error", "message" : "Error while retrieving Contents." });
		  }
		
		if (record.length>0){
			for (let i=0;i<record.length;i++) {
				record[i].content.references.forEach((objref) => { 
			    let arrauthors=[];
				let blnFree=true;
				let intDt=false;
				//setting up the JSON data to be returned to the user	
				if (objref.accessType=="premium")
				  blnFree=false;
								   
				if (objref.authors.length>0)
				  {
				    objref.authors.forEach(objAuthor => arrauthors.push(objAuthor.name) )
				  }
				if (objref.target.domains.indexOf("dailytelegraph.com.au")>=0)
					{
					   intDt=true;
					}
				let objSection=objref.target.sections[0];
				let sections = {
								 id: objSection.id,
								 link: objSection.link.self,
								 path: objSection.path,
					  	         slug: objSection.slug 
							   }
						
				jsondata = {
						     articleId : objref.id,
							 title: objref.headline.default,
							 free: blnFree,
							 standfirst: objref.standfirst.default,
							 authors : arrauthors,
							 livedate: objref.date.live,
							 dateUpdated: objref.date.updated,
							 originalSource: objref.rightsMetadata.originatedSource,
							 section: sections,
							 intDt : intDt        
						   };

						arrJSONData.push(jsondata);
							
				});
			}
			res.status(200).send({ "status": "success", "contentData" : arrJSONData });
		  }
		 else
		  {
			res.status(200).send({ "status": "info", "message" : "Content data not found." });
		  }
	    })
	}
	catch(error)
	{
		return res.status(500).json({
			status: 'error',
			message: 'An error occurred trying to retrieve data',
		})
	}
        

});

// route to save data
app.post('/contents', function(req, res) {
   // Insert JSON into MongoDB
  try {
		  // save data to contents collection
	      db.collection('contents').insert(req.body, function (err, result) {
		    if (err)
			  res.status(500).send({ "status": "error", "message" : "An error occurred trying to save contents data." });
			else
			  res.status(200).send({ "status": "success", "message" : "Contents saved successfully." });

		  });
   }
   catch(error)
    {
		return res.status(500).json({
		  status: 'error',
		  message: 'An error occurred trying to save contents data',
		})
	}

});