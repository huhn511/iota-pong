var paymentModule = require('iota-payment')
var app = require('express')()
let { PythonShell } = require('python-shell')

var NAME = process.env.NAME
var PORT = process.env.PORT
var PLAYER2_URL = process.env.PLAYER2_URL

console.log("Name: ", NAME)

var options = {
    mount: '/',
    value: 1,
    websockets: true
    // ...
}

let server = paymentModule.createServer(app, options)

// Start server with iota-payment module on '/custom'
server.listen(PORT, function () {
    console.log(`Server started on http://localhost:${PORT} `)
})

//Create an event handler which is called, when a payment was successfull
var onPaymentSuccess = function (payment) {
    console.log('payment success!', payment);
    const body = { status: "PING", name: NAME, value: payment.value };

    // show the ball
    console.log("SHOW THE BALL")
    PythonShell.run('./python/scripts/show_ball.py', {}, function (err, results) {
        if (err) throw err;
        // results is an array consisting of messages collected during execution
        console.log('results show_ball: %j', results);

        fetch(PLAYER2_URL, {
            method: 'post',
            body: JSON.stringify(body),
            headers: { 'Content-Type': 'application/json' },
        })
            .then(res => res.json())
            .then(response => {
                // send all tokens to this payment:
                console.log("send tokens to this payment: ", response.payment.address)
                paymentModule.payout.send({ address: response.payment.address, value: payment.value })
                    .then(result => {
                        console.log("THE BALL IS GONE")
                        console.log("PING!", result)   
                    })
                    .catch(err => {
                        console.log(err)
                    })
            });



    });


}

//Create an event handler which is called, when a payment was created
var onPaymentCreated = function (payment) {
    console.log('payment created!', payment);
    // wait for a ball
    PythonShell.run('./python/scripts/wait.py', {}, function (err, results) {
        if (err) throw err;
        // results is an array consisting of messages collected during execution
        console.log('results wait: %j', results);
    });
}

//Create an event handler which is called, when a payment was created
var onpaymentIncoming = function (payment) {
    console.log('payment created!', payment);
    // wait for a ball
    PythonShell.run('./python/scripts/fetch.py', {}, function (err, results) {
        if (err) throw err;
        // results is an array consisting of messages collected during execution
        console.log('results fetch: %j', results);
    });
}


var onpayoutCreated = function (payout) {
    console.log('payout created!', payout);

    // targeting player to throw the ball
    // throw the ball
    PythonShell.run('./python/scripts/send.py', {}, function (err, results) {
        if (err) throw err;
        // results is an array consisting of messages collected during execution
        console.log('results wait: %j', results);
    });
}

var onpayoutSuccess = function (payout) {
    console.log('payout success!', payout);

    // throw the ball
    PythonShell.run('./python/scripts/show_success.py', {}, function (err, results) {
        if (err) throw err;
        // results is an array consisting of messages collected during execution
        console.log('results wait: %j', results);
        PythonShell.run('./python/scripts/standby.py', {}, function (err, results) {
            if (err) throw err;
            // results is an array consisting of messages collected during execution
            console.log('results standby: %j', results);
        });
    });
}


paymentModule.on('paymentCreated', onPaymentCreated);
paymentModule.on('paymentIncoming', onpaymentIncoming);
paymentModule.on('paymentSuccess', onPaymentSuccess);

paymentModule.on('payoutSuccess', onpayoutSuccess);
paymentModule.on('payoutCreated', onpayoutCreated);


PythonShell.run('./python/scripts/standby.py', {}, function (err, results) {
    if (err) throw err;
    // results is an array consisting of messages collected during execution
    console.log('results standby: %j', results);
});