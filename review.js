var mongoose = require('mongoose');
var Schema = mongoose.Schema;

mongoose.Promise = global.Promise;

mongoose.connect(process.env.DB_USER, { useNewUrlParser: true } );
mongoose.connection.once('open', function(){
    console.log('Review connection has been made!');
}).on('error', function(error){
    console.log('Error is: ', error);
});
mongoose.set('useCreateIndex', true);

var ReviewSchema = new Schema({
    'title': String,
    'username': String,
    'quote': String,
    'rating': Number
});

module.exports = mongoose.model('Review', ReviewSchema);

