# Lekker

**🚨 Work in progress. Not ready for consumption🚨**

Control sex toys using your tongue. Lekker tracks your face in real time using the True Depth camera. To control the toys, you stick out your tongue to "lick" a virtual 3D heart shown in the app. The rate, intensity, and duration of your actions against the virtual heart determine the vibration strength of the real world toys.

**Links**

- [App Store](TODO)
- [Introductory blog post](TODO)

## Usage

### Supported toys

- Lovense Lush Vibrator
- Lovense Hush Vibrator


## Contributing

### Report an issue
If you run into any problems while using the app, please file an issue [here][newIssue]. Be sure to include:

- What type of toys you had connected.
- Steps to reproduce the problem.
- What you expected to happen.
- What actually happened.

### Request a feature
If you have any ideas on how Lekker could be improved, please [submit a feature request][newIssue].

If there you'd like to see another toy supported, either:

- Submit a PR that adds support.
- Or send my a new copy of the toy (along with relevant API documentation) so that I can integrate support into the app.


### Code
Lekker is written in TypeScript and uses React Native. The general structure of the project is:

```
heart/ — Webview content that displays the heart
    src/ — Source for the webview

mobile/ - React native application
    ios/ - xCode project and native source
    src/ — TypeScript sources
```

**Building the heart webview**

The heart webview lives under `heart/`. The output is an html page that displays the 3D heart using WebGL (it uses a webview because I couldn't figure out how to code it in scenekit fast enough). To build it:

```bash
cd heart
npm install
npm run compile
```

This compiles the files in `heart/src` to `heart/dist`. Start a local server to view the heart:

```bash
npx http-server .
```

Then open `http://localhost:8080/`

**Building the mobile app**

The main iOS application is under `mobile/`. To build and run the app:

```bash
cd mobile
npm install

# Compile TS
npm run compile 

# Start app
npm start
```



Note that only the code in this repo is licensed under MIT. Assets, such as the logo and help animations, are included in this repo but can only be used for Lekker. 


[newIssue]: https://github.com/mattbierner/lekker/issues/new