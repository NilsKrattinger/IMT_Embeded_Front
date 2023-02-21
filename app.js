const express = require('express');
const {SerialPort} = require('serialport');
const cors = require('cors');

let serialDataBuffer = "";
let JsonDb = {
    1: [],
    2: [],
    3: []
}


const app = express();
app.use(express.json()); // middleware to parse JSON request bodies

app.use(cors('*'));

const settings = {
    path: '/dev/ttyACM0', // Replace with the path to your serial port
    baudRate: 115200 // Replace with the baud rate of your serial device
};
// Create a new serial port instance
const port = new SerialPort(settings);
port.on('data', (chunk) => {
    for (const byte of chunk) {
        serialDataBuffer += String.fromCharCode(byte)
        //dataBuffer.push(String.fromCharCode(byte));
    }

    if (chunk.indexOf('}') > 0) {
        searchAndPrintJsonInBuffer(serialDataBuffer)
    }
});

port.on('error', (err) => {
    console.error('Serial port error:', err);
});


// Define a route to get the accumulated data in chunks of 32 characters
app.get('/get-data', (req, res) => {
    // Convert the dataBuffer array to a single Buffer object
    let data = JsonDb;
    // Send the data back to the client in the response
    JsonDb = {
        1: [],
        2: [],
        3: []
    }
    res.send(JSON.stringify(data))
    // Clear the dataBuffer array after sending the data
});

app.post('/configure', (req, res) => {
    // Convert the dataBuffer array to a single Buffer object
    console.log(JSON.stringify(req.body.configObject))
    port.write(JSON.stringify(req.body.configObject))
    res.send('OK')
    // Clear the dataBuffer array after sending the data
});


app.get('/generate-data', (req, res) => {
    // Define the number of fake messages to generate
    const numMessages = 10;

    // Generate the fake messages
    let messages = [];
    for (let i = 1; i <= numMessages; i++) {
        // Generate a random id and value for the message
        let id = Math.floor(Math.random() * 4);
        let value = Math.floor(Math.random() * 100);

        // Generate a timestamp for the message
        let timestamp = new Date().toISOString();

        // Create the message as a JSON object
        let message = {
            "1": timestamp,
            "2": id,
            "3": value
        };
        messages.push(message);
    }

    // Send the fake messages to the client
    res.send(messages);
});


app.listen(3000, () => {
    console.log('Server started on port 3000');
});

function searchAndPrintJsonInBuffer(data) {
    // Convert the buffer to a string

    let index = data.indexOf('{');
    let corruptedPart = data.substring(0, index)
    //console.log("Corrupted : " + corruptedPart)

    data = data.replace(corruptedPart, '');

    // Search for JSON objects in the data string
    const jsonRegex = /{[\s\S]*?}/g;
    let match
    while (match = jsonRegex.exec(data)) {
        const JSON = formatStringToJson(match[0]);
       // console.log("JSON FOUNED : ", JSON)
        JsonDb[JSON['2']].push(JSON)
    }
    let treatedDataIndex = data.lastIndexOf('}')
    let treatedData = data.substring(0, treatedDataIndex + 1)

    data = data.replace(treatedData, '');

    //console.log("untreatedpart : ", data)
    serialDataBuffer = data;

    //console.log("___________________");
}


function formatStringToJson(str) {
    // Remove the opening and closing curly braces
    str = str.substring(1, str.length - 1);

    // Split the string into key-value pairs
    const pairs = str.split(',');

    // Create an object to hold the key-value pairs
    const obj = {};

    // Iterate over the key-value pairs and add them to the object
    for (const pair of pairs) {
        const [key, value] = pair.split(':');

        // Add the key-value pair to the object with the key in double quotes
        obj[`${key}`] = value;
    }

    // Convert the object to a JSON string and parse it to a JSON object
   // console.log(JSON.stringify(obj))
    // Return the JSON object
    return JSON.parse(JSON.stringify(obj));
}

