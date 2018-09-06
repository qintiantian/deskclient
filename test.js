const prepend = require('./js/prepend')
const fs = require('fs')

let d = fs.readFileSync('./app.js', 'utf8')
let hd = prepend.formFrame(Buffer.from(d))
console.log(hd.toString())