var paymentModule = require('iota-payment')
var app = require('express')()

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
                    console.log("PING!", result)
                })
                .catch(err => {
                    console.log(err)
                })
        });
}

paymentModule.on('paymentSuccess', onPaymentSuccess);
