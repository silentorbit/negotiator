---
layout: default
title: Home
menu_order: 1
menu:
  title: Home
---

# Negotiator

*Formerly known as "KISS Privacy"*

## Chrome and Firefox WebExtension

Negotiator is a web extension which gives users who are familiar with http requests the tool to simply block and modify them permanently.

## The web is not a done deal

You no longer need to blindly accept what the web offers. This extension allows you to set your own terms. Simple http request and response filtering for advanced users.

# Install on Chrome

<button onclick="chrome.webstore.install('https://chrome.google.com/webstore/detail/lfopjlendebbnfddpgpoaahmpbgmffii', function(d){console.log('installed')},function(e){console.log('not installed: '+ e)})" id="install-button">Add to Chrome</button>
<script>
if (chrome.app.isInstalled) {
  document.getElementById('install-button').style.display = 'none';
}
</script>

[Install from Chrome Web Store](https://chrome.google.com/webstore/detail/negotiator/lfopjlendebbnfddpgpoaahmpbgmffii)

# Install on Firefox

[Install from Firefox Add-ons](https://addons.mozilla.org/en-US/firefox/addon/negotiator/)
