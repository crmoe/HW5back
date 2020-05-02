var mongoose = require('mongoose');
var Schema = mongoose.Schema;

mongoose.Promise = global.Promise;

mongoose.connect(process.env.DB_USER, { useNewUrlParser: true } );
mongoose.connection.once('open', function(){
    console.log('Image conection has been made!');
}).on('error', function(error){
    console.log('Error is: ', error);
});
mongoose.set('useCreateIndex', true);

var ImageSchema = new Schema({
    title: String,
    img: {data: Buffer, contentType: String}
});

module.exports = mongoose.model('Image', ImageSchema);