# Basiq Blink

Basiq Blink is the simplest way of using Basiq's Connect service with
your applications.

## Introduction

The Basiq Blink service enables you  to easily implement our services
into your application by providing you with a simple usage interface. The interface provided is a web based, served from Cloudfront so the latency should be minimal. It can be used from your iOS or Android apps using a webview, or web based apps by using our JS control, or by manually displaying it using an iframe.

## Setup

To use the service you need to have the following infrastructure:

1. Your server which will be used to generate and retrieve users, and
to generate an access token with restricted access.
2. The client to communicate with the server and display the web page
for connecting the account.

## Usage

You have deployed your server which communicates with the Basiq's API,
you have setup your database to hold the users and connections info, and
everything is ready to start implementing the client.

### Simplified flow

* The client asks the server for the user_id by using an internal user identificator (uuid, email etc...)
* The server responds with the user_id either by fetching it from the database (if the user is already in the Basiq's system) or by creating a new user entity.
* The client asks the server for the access_token.
* The server asks the Basiq API for the access token, specifying the token scope as RESTRICTED_ACCESS, and returns it.
* The client now displays the webpage by providing the received user_id and access_token info as query parameters (in case of using the interface from iframe, specify iframe=true query param)

The end user will be able to connect to their bank account and the end
result will be a connection id which can be used to fetch transaction data, bank history etc...

### Communication

The web interface can communicate to the client displaying it by either
using a custom protocol (basiq://) or with window.postMessage API. When
displaying the web interface in a web client, we offer a JS control that
will simplify your implementation and allow you to focus on your bussiness
functionality.

## Example implementations

The following are custom client implementations:

* [Android](android.com)
* [iOS](ios.com)
* [Custom Web iFrame](iframe.com)
* [Using the JS control](jscontrol.com)

We also provide example server implementations:

* [Node.js](node.com)
* PHP
* Go