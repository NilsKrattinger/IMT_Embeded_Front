const express = require('express');
const {SerialPort} = require('serialport');
const cors = require('cors');

const app = express();
const settings = {
    path: '/dev/ttyACM0', // Replace with the path to your serial port
    baudRate: 115200 // Replace with the baud rate of your serial device
};
// Create a new serial port instance
const port = new SerialPort(settings);

let dataBuffer = []
// Use the 'readable' event to read data from the serial port
port.on('readable', () => {
    let data = port.read();
    if (data) {
        // Append the data to the dataBuffer
        dataBuffer.push(data)
    }
});

// Handle errors that occur while reading from the serial port
port.on('error', (err) => {
    console.error('Serial port error:', err);
});

// Use the cors middleware to enable CORS
app.use(cors());

// Define a route to get the accumulated data in chunks of 32 characters
app.get('/get-data', (req, res) => {
    // Split the dataBuffer into chunks of 32 characters
    let chunks = [];
    for (let i = 0; i < dataBuffer.length; i += 48) {
        chunks.push(dataBuffer.slice(i, i + 48));
    }


    // Convert the chunks to an array of strings
    let messages = chunks.map(chunk => chunk.toString('ascii'));

    // Send the messages back to the client in the response
    res.send(messages);

    // Remove the processed data from the dataBuffer
    dataBuffer = dataBuffer.slice(chunks.length * 32);
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
