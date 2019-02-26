# Blink drop in control

## Development

Basiq Blink uses linting as pre commit hook. Run 

```$ npm install```

to install required dependencies.

## Build

To build package run

```$ npm run build```

Build process fetches configuration from configured AWS environment.

## Deployment

To deploy to bucket in configured AWS environment run

```$ npm run deploy```

## Running locally

To run the package locally install local server:

```$ npm -g install static-server```

While in the dist directory run static server to serve the files

```$ static-server```

The app should listen by default to port 9080.
