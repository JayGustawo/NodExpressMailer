const mongoose = require('mongoose');

//connect to db
mongoose.connect(process.env.DATABASE, {
    useNewUrlParser:true,
    useFindAndModify:true,
    useUnifiedTopology:true,
    useCreateIndex:true
}).then(()=>console.log("DB connection established"))
.catch(err => console.log("DB Connection Error: ",err));