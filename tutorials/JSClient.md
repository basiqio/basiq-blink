# Basiq Blink JS Client

[**JSClient example repository**](https://github.com/basiqio/basiq-blink-js-component)

## Introduction

This JS client is the simplest way of allowing your user to connect their bank
accounts to your application.

## Setup

Include the ```basiq.client.min.js``` into your web page.

```html
<script src="http://js.basiq.io/v1/basiq.client.min.js"></script>
``

To instantiate the Basiq client object you need to have access_token and user_id available.

### Usage

Create a new Basiq instance:

```
var basiq = new Basiq({
    userId,
    accessToken
});
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

Function signature for event callbacks is ```(payload, event)```

```js
basiq.addListener("connection", function (payload) {
    console.log("Connection:", payload);
    basic.destroy();
});

basiq.addListener("completion", function () {
    basic.destroy();
});

basiq.addListener("cancellation", function () {
    basic.hide();
});
```

You can also pass in an array of events with the callback.

```
basiq.addListener(["completion", "cancellation"], function () {
    basic.destroy();
});
```

### Available events

Event | When is it triggered | Callback data
--- | --- | ---
```handshake``` | When a handshake is established | {success: true}
```job``` | When a job is created | {success: [bool], data: { id: [string]}}
```connection``` | When a connection is created | {success: [bool], data: { id: [string]}}
```cancellation``` | When a user has closed the modal form  | null
```completion``` | When a user has completed the process by clicking on "Done" | null

The callbacks receive the event payload which can be used to track user's progress and
react to user's actions. The most important event is the ```connection```, which indicates the user
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
* [Using the JS control](https://github.com/basiqio/basiq-blink-js-component)

We also provide example server implementations:

* [Node.js](node.com)