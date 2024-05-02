const express = require('express');
require('./config');
const app = express();
app.use(express.json());
const userData = require('./userData');

app.post("/", async(req,resp)=>{
    let data = new userData(req.body);
    let result = await data.save();
    resp.send(result);
});

app.listen(5100);