Real Estate Notification System - README

This tool is designed to help people monitor Italian auctions by providing real-time notifications about relevant listings. Using data from the official Italian Ministry of Justice auction portal (PVP Giustizia), the system simplifies access to auction information, helping users stay updated and take timely actions.

This guide explains how to set up and deploy the Real Estate Notification System that queries real estate auction data, filters results, stores relevant listings in MongoDB, and sends email alerts using AWS SES.

Prerequisites

Tools Required

Node.js (latest LTS version recommended)

AWS account with SES configured

MongoDB Atlas account

AWS Lambda and EventBridge access

Setup Instructions

Step 1: Customize the Query Body

Navigate to PVP Giustizia.

Perform a search using the Advanced Search option.

Open the browser's Network Tab.

Find the POST request to the vendite endpoint.

Copy and customize the request body to match your desired search parameters.

Replace the body parameter in the code with your customized version.

Step 2: Customize the Date Filter

Modify the dateFilter parameter in the code to the current date to ensure only recent listings are processed. Example:

const dateFilter = new Date("2024-01-01"); // Update to the current date before deploying

Step 3: Set Up MongoDB Atlas

Create a free account at MongoDB Atlas.

Set up a free cluster.

Obtain the connection string:

Replace <username> and <password> with your MongoDB username and password.

Replace <cluster-url> with your cluster's URL.

Add the connection string to a .env file:

MONGO_URI=mongodb+srv://<username>:<password>@<cluster-url>/myFirstDatabase?retryWrites=true&w=majority

Step 4: Configure AWS SES

Log in to your AWS account.

Navigate to the SES (Simple Email Service) section.

Verify your email address under Email Addresses.

SES is in sandbox mode by default; ensure the email is verified.

Update the SES_EMAIL variable in the code with your verified email address.

Step 5: Deploy the Lambda Function

Zip the code along with the node_modules and .env file:

zip -r function.zip .

Log in to the AWS Management Console.

Navigate to Lambda and create a new function:

Use a custom runtime or Node.js.

Upload the function.zip file.

Set up environment variables in the Lambda configuration to include MONGO_URI.

Adjust Lambda permissions to allow SES and internet access.

Step 6: Set Up a Cron Trigger Using EventBridge

Navigate to the EventBridge section in AWS.

Create a new rule:

Select a Scheduled Event.

Use a cron expression to define the schedule (e.g., run once per day):

cron(0 0 \* _ ? _)

Attach the Lambda function to this rule.

Testing the System

Deploy the Lambda function.

Trigger it manually to ensure:

Listings are fetched and stored in MongoDB.

Emails are sent correctly for new listings.

Check MongoDB and your email inbox for results.
