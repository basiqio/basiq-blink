# Basiq Blink Android Example

[**Android example repository**](https://github.com/basiqio/basiq-android-blink-demo)

## Introduction

This example will explain the basic implementation of Basic Blink service into your Android application.

## Communication

Your application can communicate with the basic webview app using custom protocols. You can track
these protocol invocations by implementing a custom ```WebViewClient``` and override the
```shouldOverrideUrlLoading ``` method. The ```shouldOverrideUrlLoading``` method is invoked
every time a url change is triggered in the webview with the change event data. Inside the
event data the url is available, and you parse the url to get the necessary info.

## Example WebViewClient

You can find the source code from the example [here](https://github.com/basiqio/basiq-android-blink-demo/blob/master/app/src/main/java/com/example/nlukic/webviewtest/utils/WebViewClientWithListener.java).

As you can see in the following code snippet:

```java
if (url != null && url.startsWith("basiq://")) {
    Integer payloadStart = url.indexOf("{");
    String payloadString;
    String event;
    if (payloadStart != -1) {
        payloadString = url.substring(payloadStart);
        event = url.substring(url.indexOf("//") + 2, payloadStart - 1);
    } else {
        payloadString = "{}";
        event = url.substring(url.indexOf("//") + 2);
    }
    try {
        JSONObject payload = new JSONObject(payloadString);
        parseEventData(event, payload);
    } catch (Exception ex) {
        Log.v("ReceivedProtocolError", "JSON exception: "+ex.getMessage());
    }
    Log.v("ReceivedProtocol", "URI: " + url + " | Event: " + event + " | Payload: " + payloadString);
    return true;
} else {
    return false;
}
```

We detect if the url starts with the "basiq" protocol, and in that case parse it. The
payload is a JSON string, and it comes after the event name. Example:

```
basiq://connection/{"id":"klqwd-qwdoijjoqd102wq-djkqw"}
```

In the example, *connection* is the event name, and the payload contains the connection id
in the JSON. We can parse the payload by detecting if any payload exists by checking for the
opening brace, and then trying to parse the JSON using ```JSONObject```

## Application

You can examine the entire application and see how it all connects [here](https://github.com/basiqio/basiq-android-blink-demo/tree/master/app/src/main/java/com/example/nlukic/webviewtest).

## Other implementations

The following are other custom client implementations:

* [iOS](https://github.com/basiqio/basiq-blink/edit/master/tutorials/iOS.md)
* [Custom Web iFrame](iframe.com)
* [Using the JS control](jscontrol.com)

We also provide example server implementations:

* [Node.js](node.com)
