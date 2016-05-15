var npmcss = require('..');
var path = require('path');

var source = path.resolve('./css/index.scss');
var output = path.resolve('./bundle.css');
npmcss(source, output);
