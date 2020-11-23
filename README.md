# WEtech-Bot (aka Chat-Bot)
DSC Solution Challenge - 2020

## Insight
A responsive chatbot developed for WEtech Alliance to fulfill user queries that provide 24/7 continuous service to WEtech users. The bot is functional, which can handle user requests and perform actions like adding specified events from WEtech to the user's calendar and also provide mail notifications. The prime goal of this work is to provide a user-friendly service to WEtech users. This work was also submitted in DSC Solution Challenge 2020.

## Prerequisite
Before testing the bot make sure to have the following,

### Accounts required:
- A google account linked with Dialogflow, action-on-google, firebase and google cloud platform
- A service account (Create one in google cloud platform)
- A valid email ID (For Nodemailer to send mail)

### Packages required:
- iCal
- Nodemailer

### For testing follow the procedures,
- First, download this repository to your system. Then create an agent in Dialogflow and upload the WEtech-agent.zip file to you Dialogflow agent by going to agent setting and toggling to "Export and Import" bar. This will add all our intents to your agent.
- Copy the index.js and pacakge.json files to the fulfilment editor. Before copying make sure to delete the existing code.
- Follow the comments in index.js to add your service account details and email account.

## Learn More
Video Explanation - https://www.youtube.com/watch?v=No4SR9zYSC0



