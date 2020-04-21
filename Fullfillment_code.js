"use strict";

//import package
const functions = require("firebase-functions");
const { google } = require("googleapis");
const { WebhookClient } = require("dialogflow-fulfillment");
const ics = require("ics");
var nodemailer = require("nodemailer");

//Service account details
//Starts with {"type": "service_account",...
const serviceAccount = {

};

//Set up Google Calendar Service account credentials
const serviceAccountAuth = new google.auth.JWT({
    email: serviceAccount.client_email,
    key: serviceAccount.private_key,
    scopes: "https://www.googleapis.com/auth/calendar",
});

const calendar = google.calendar("v3");
process.env.DEBUG = "dialogflow:*"; //Enables lib debugging statements

exports.dialogflowFirebaseFulfillment = functions.https.onRequest(
    (request, response) => {
        const agent = new WebhookClient({ request, response });

        function listTheAskedEvents(agent) {
            var userAskedDate_1 = agent.parameters.date ?
                agent.parameters.date.split("T")[0] :
                agent.parameters["date-period"].startDate;
            var userAskedDate = userAskedDate_1 ?
                userAskedDate_1 :
                new Date().toISOString();
            //Additional
            return listEvents(userAskedDate, null)
                .then((value) => {
                    var newArray = [];
                    value.map((event, i) => {
                        const start = event.start.dateTime || event.start.date;
                        newArray.push(`${event.summary}-${start.split("T").join("  ")} `);
                    });
                    agent.add(`${newArray.join("\n\n")}`);
                    if (value) {
                        if (newArray.length !== 0) {
                            agent.add(
                                `Would you like me to send event details to your mail?\n(Yes/No)`
                            );
                        } else {
                            agent.add(
                                `Sorry there are no events in the particular date(${
                  userAskedDate.split("T")[0]
                }), please try other dates.`
                            );
                        }
                    }
                })
                .catch((err) => {
                    console.log("error from listings is :" + err);
                    agent.add(`I'm sorry, There are no Events`);
                });
        }
        //Function to make the appointments request
        function scheduleTheEvents(agent) {
            var eventName = agent.parameters.event;
            var userAskedDate_1 = agent.parameters.userDate ?
                agent.parameters.userDate.split("T")[0] :
                agent.parameters.userDatePeriod.startDate;
            var userAskedDate = userAskedDate_1 ?
                userAskedDate_1 :
                new Date().toISOString();
            return listEvents(userAskedDate, eventName, 1)
                .then((value) => {
                    value.map((event, i) => {
                        //ICS file creation
                        const eventStartDate = new Date(event.start.dateTime);
                        const eventEndDate = new Date(event.end.dateTime);
                        //Event start duration details
                        const eventStartYear = eventStartDate.getFullYear();
                        const eventStartMonth = eventStartDate.getMonth() + 1;
                        const eventStartDay = eventStartDate.getDate();
                        const eventStartHours =
                            eventStartDate.getHours() <= 18 ?
                            eventStartDate.getHours() + 5 :
                            eventStartDate.getHours();
                        const eventStartMinutes = eventStartDate.getMinutes();
                        //Event end details
                        const eventEndYear = eventEndDate.getFullYear();
                        const eventEndMonth = eventEndDate.getMonth() + 1;
                        const eventEndDay = eventEndDate.getDate();
                        const eventEndHours =
                            eventEndDate.getHours() <= 18 ?
                            eventEndDate.getHours() + 5 :
                            eventEndDate.getHours();
                        const eventEndMinutes = eventEndDate.getMinutes();
                        const eventToAdd = {
                            start: [
                                Number(eventStartYear),
                                Number(eventStartMonth),
                                Number(eventStartDay),
                                eventStartHours,
                                eventStartMinutes,
                            ],
                            end: [
                                Number(eventEndYear),
                                Number(eventEndMonth),
                                Number(eventEndDay),
                                eventEndHours,
                                eventEndMinutes,
                            ],
                            title: event.summary,
                            description: event.description,
                            location: event.location,
                            url: event.url,
                            organizer: { email: event.organizer.email },
                        };
                        ics.createEvent(eventToAdd, (error, value) => {
                            if (error) {
                                console.log(error);
                                return;
                            }
                            var mailOptions = {
                                from: "  ", //Mail id 
                                to: agent.parameters.email,
                                subject: `Details about the event ${event.summary}`,
                                text: `${eventToAdd.description}`,
                                html: `<!DOCTYPE html>
                                <html lang="en">
                                
                                <head>
                                    <meta charset="utf-8">
                                    <meta name="viewport" content="width=device-width" />
                                    <title>Event information</title>
                                </head>
                                
                                <body style="margin: 0;padding: 0;background-repeat: no-repeat;background-image: url('https://lh5.googleusercontent.com/proxy/Jdk-ZoxxWczTIQ4HYn2NrmIHycbs9LqZbYuOEuAWLwnzwH_rgTsOCVRQry6_U0xBenLLJCIstgk5906G1uq3TL7igmsdh6e-KcYwdFlmqw6KiWse3Tl7JSkmM3azWusM');background-size: cover;font-family: 'Lucida Sans', 'Lucida Sans Regular', 'Lucida Grande', 'Lucida Sans Unicode', Geneva, Verdana, sans-serif;">
                                
                                    <div style="margin: 0 auto; max-width: 600px; text-align: center;">
                                        <img src="https://www.wetech-alliance.com/wp-content/uploads/2019/07/TECH-EVENTS-1.png" style="max-width: 100%;margin: auto;padding: 15px 0;display:block">
                                        <h2>Please find the attached calendar file</h2>
                                        <p></p>
                                        <p>Open the file to add event information to your calendar</p>
                                    </div>
                                
                                    <br>
                                    <br>
                                    <br>
                                
                                    <footer>
                                        <div style="margin: 0 auto; max-width: 600px; text-align: center;">
                                            <img src="https://www.wetech-alliance.com/wp-content/uploads/2018/05/logo-wetech.png">
                                            <h3>Contact</h3>
                                            <p>Joyce Entrepreneurship Centre 2455 Wyandotte Street West Located inside EPICentre, 2nd Floor Windsor, ON N9B 0C1 Office: 519.997.2863</p>
                                        </div>
                                    </footer>
                                
                                </body>
                                
                                </html>`,
                                icalEvent: {
                                    filename: `${eventToAdd.title}.ics`,
                                    method: "request",
                                    content: value,
                                },
                            };
                            //Mailing credentials 
                            var transporter = nodemailer.createTransport({
                                service: "gmail",
                                auth: {
                                    user: "  ",
                                    pass: "  ",
                                },
                            });
                            transporter.sendMail(mailOptions, function(error, info) {
                                if (error) {
                                    console.log("error is ", error);
                                    agent.add("Please Enter  the correct Email Address ");
                                } else {
                                    console.log("success", info.response);
                                }
                            });
                        });
                        agent.add(
                            `${event.summary}'s event information has been sent to your account, ${agent.parameters.email}`
                        );
                    });
                })
                .catch((err) => {
                    console.log("error from schedule  is :" + err);
                    agent.add("Please mention the event name correctly");
                });
        }
        let intentMap = new Map();
        intentMap.set("Ask_To_List_Events", listTheAskedEvents);
        intentMap.set("Ask_To_List_Events - Yes", scheduleTheEvents);
        agent.handleRequest(intentMap);
    }
);

//Event listing function
function listEvents(userAskedDate = 0, eventName = null, noOfResult = 10) {
    return new Promise((resolve, reject) => {
        calendar.events.list({
                auth: serviceAccountAuth, //List events for time period
                calendarId: "  ", //Organisations calendar or sites calendar
                timeMin: new Date(userAskedDate).toISOString(),
                q: eventName,
                maxResults: noOfResult,
                singleEvents: true,
                orderBy: "startTime",
            },
            (err, res) => {
                if (err) {
                    reject(err || new Error("Failed to pull events"));
                } else {
                    if (eventName) {
                        if (res.data.items != 0) {
                            resolve(res.data.items);
                        } else {
                            reject(new Error("There are no events in the given name, kindly give a valid event name"));
                        }
                    } else {
                        resolve(res.data.items);
                    }
                }
            }
        );
    });
}