# Basiq Blink JSClient Example

[**JSClient example repository**](https://github.com/basiqio/basiq-android-blink-demo)

## Introduction

This example will explain the basic implementation of Basic Blink service into your web application
using our JS client. The JS client will display a modal window centered in the viewport,
which will allow the user to connect to their bank account. The focus of the developer is on the
business logic, not on the implementation details.

## Setup

Include the ```basiq.client.min.js``` into your webpage.

To instantiate the Basiq client object you need to have access_token and user_id available.

### Start

Create a new Basiq instance:

```
var basiq = new Basiq({
    userId,
    accessToken
});
```

To attach the client to the *message* event of the window perform the ```init()``` method of the object.

```
basiq.init();
```

Now you are ready to display the web application. You can do that by invoking the ```render()``` method.
The most common use case will be opening the modal window

```
document.getElementById("connectYourAcc").onclick = function () {
    basiq.render();
};
```

### Listening for events

You can listen and react to all events emitted by the web app by using the ```addListener(event, cb)``` method.
Multiple listeners per event are supported. The basic events you should always react to
 are *connection* and *cancellation*.

```js
basiq.addListener("connection", function (payload) {
    console.log("Connection:", payload);
    basic.destroy();
});

basiq.addListener("cancellation", function (payload) {
    basic.hide();
});
```

The callbacks receive the event payload which can be used to track user's progress and
react to user's actions. The final event is the connection, which indicates the user
has completed the connection process and which returns the connection id, which can be
used to fetch user's bank data.

### Resetting the web app state

We have exposed the ```destroy()``` method to allow the web app to be detached from DOM and
to reset its state. This allows the clients implementing it to be flexible.

## Application

You can examine the entire application and see how it all connects [here](https://github.com/basiqio/basiq-android-blink-demo/tree/master/app/src/main/java/com/example/nlukic/webviewtest).

## Other implementations

The following are other custom client implementations:

* [Android](android.com)
* [iOS](ios.com)
* [Using the JS control](jscontrol.com)

We also provide example server implementations:

* [Node.js](node.com)