# Basiq Blink iframe Example

[**iframe example repository**](https://github.com/basiqio/basiq-android-blink-demo)

## Introduction

This example will explain the basic **custom** implementation of Basic Blink service into your web application.

[We also provide a JS client that you can use to easily implement Basiq without having to manually worry about
the details.](https://github.com/basiqio/basiq-android-blink-demo)

## Communication

Your application can communicate with the basic web app using ```window.postMessage```. The web
app will use ```window.postMessage``` instead of the protocol if you pass along the ```iframe=true```
query parameter to the url. Upon every event the iframe will send a message containing the event, and event payload,
the payload can be examined to extract useful data that should be saved for future reference.

## Example listener

```js
window.addEventListener('message', function (e) {
    const data = JSON.parse(e.data),
        event = data.event,
        payload = data.payload;

    switch (event) {
        case "connection":
            //Save connection details
            break;
        case "cancellation":
            //Exit the process and return the user to the previous step
            break;
    }
})
```

To get the information the only thing required is to perform ```JSON.parse``` on
the event.data property. The data will contain event and payload properties
which can be used to perform different actions in relation the event being sent.

## Application

You can examine the entire application and see how it all connects [here](https://github.com/basiqio/basiq-android-blink-demo/tree/master/app/src/main/java/com/example/nlukic/webviewtest).

## Other implementations

The following are other custom client implementations:

* [Android](android.com)
* [iOS](ios.com)
* [Using the JS control](jscontrol.com)

We also provide example server implementations:

* [Node.js](node.com)