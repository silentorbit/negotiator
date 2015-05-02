---
layout: post
title: KISS Privacy Goodbye
---

There are fundamental changes being made to the **KISS Privacy** extension.

The current extension hosted at the [Chrome Web Store](https://chrome.google.com/webstore/detail/kiss-privacy/lfopjlendebbnfddpgpoaahmpbgmffii?hl=en-US) will stay at its current version. It won't receive any changes described here.

The version hosted at [silentorbit.com](https://silentorbit.com/negotiator/) has already begun the transition.

A new extension will be published at the Chrome Web Store with the new name, Negotiator.

# The changes

A **new name**, Negotiator to indicate the purpose of the extension, to let you as a user have a say in what the browser is doing.

**Fully customizable actions**. Previously a simple but limited set of actions was enabled for specific headers. The new method allows you to customize any headers including injecting new ones into the stream. While more powerful it requires more knowledge from the user, you must know your HTTP headers.

The **limitations of chrome sync**, with a maximum of 512 entries, makes it mostly unusable once your filter list grows larger. Attempts was made to cheat by bundling multiple filters into each chrome sync entry but in the end it would have made the code way too complex. Pull requests that solve this will be accepted but we're not holding our breath.

Instead we designed a **new simple protocol for synchronization**. We have written a server that we host for testing. The goal is to offer a service for a fee. See it as an opportunity to support the extension.  
You can also run your own server, there won't be any licence fees but you you will pay for hosting, maintenance and development.

The existing storage modes of local and chrome sync will still be available. And you can always use the export/import feature to move your filters to other clients.

