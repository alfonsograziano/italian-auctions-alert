# Real Estate Notification System

This tool is designed to help people monitor Italian auctions by providing real-time notifications about relevant listings. Using data from the official Italian Ministry of Justice auction portal (PVP Giustizia), the system simplifies access to auction information, helping users stay updated and take timely actions.

This guide explains how to set up and deploy the Real Estate Notification System that queries real estate auction data, filters results, stores relevant listings in MongoDB, and sends email alerts using AWS SES.

## Prerequisites

### Tools Required

- **Node.js** (latest LTS version recommended)
- **AWS account with SES configured**
- **MongoDB Atlas account**
- **AWS Lambda and EventBridge access**

---

## Setup Instructions

### Step 1: Customize the Query Body

1. Navigate to **PVP Giustizia**.
2. Perform a search using the **Advanced Search** option.
3. Open the browser's **Network Tab**.
4. Find the POST request to the `vendite` endpoint.
5. Copy and customize the request body to match your desired search parameters.
6. Replace the `body` parameter in the code with your customized version.

### Step 2: Customize the Date Filter

Modify the `dateFilter` parameter in the code to the current date to ensure only recent listings are processed. Example:

```
const dateFilter = new Date("2024-01-01"); // Update to the current date before deploying
```

### Step 3: Set Up MongoDB Atlas

1. Create a free account at **MongoDB Atlas**.
2. Set up a free cluster.
3. Obtain the connection string:
   - Replace `<username>` and `<password>` with your MongoDB username and password.
   - Replace `<cluster-url>` with your cluster's URL.
4. Add the connection string to a `.env` file:

```
MONGO_URI=mongodb+srv://<username>:<password>@<cluster-url>/myFirstDatabase?retryWrites=true&w=majority
```

### Step 4: Configure AWS SES

1. Log in to your **AWS account**.
2. Navigate to the **SES (Simple Email Service)** section.
3. Verify your email address under **Email Addresses**.
   - Note: SES is in sandbox mode by default; ensure the email is verified.
4. Update the `SES_EMAIL` variable in the code with your verified email address.

### Step 5: Deploy the Lambda Function

1. Zip the code along with the `node_modules` and `.env` file:

   ```
   zip -r function.zip .
   ```

2. Log in to the **AWS Management Console**.
3. Navigate to **Lambda** and create a new function:
   - Use a custom runtime or Node.js.
4. Upload the `function.zip` file.
5. Set up environment variables in the Lambda configuration to include `MONGO_URI`.
6. Adjust Lambda permissions to allow SES and internet access.

### Step 6: Set Up a Cron Trigger Using EventBridge

1. Navigate to the **EventBridge** section in AWS.
2. Create a new rule:
   - Select a **Scheduled Event**.
   - Use a cron expression to define the schedule (e.g., run once per day):
     ```
     cron(0 0 * * ? *)
     ```
3. Attach the Lambda function to this rule.

---

## Testing the System

1. Deploy the Lambda function.
2. Trigger it manually to ensure:
   - Listings are fetched and stored in MongoDB.
   - Emails are sent correctly for new listings.
3. Check MongoDB and your email inbox for results.

---

### Congratulations! 🎉

You have successfully set up the Real Estate Notification System. It will now monitor Italian auctions and keep you updated in real-time.
