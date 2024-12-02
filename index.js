const AWS = require('aws-sdk');
const sgMail = require('@sendgrid/mail');  
// Retrieve environment variables
const FROM_EMAIL = process.env.FROM_EMAIL;
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const secretsManager = new AWS.SecretsManager();
let cachedSecrets = null;
const getEmailCredentials = async () => {
    if (cachedSecrets) {
        return cachedSecrets;
    }
    const secretName = process.env.EMAIL_CREDENTIALS_SECRET_NAME;
    if (!secretName) {
        throw new Error('EMAIL_CREDENTIALS_SECRET_NAME environment variable is not set.');
    }
    const data = await secretsManager.getSecretValue({ SecretId: secretName }).promise();
    if ('SecretString' in data) {
        cachedSecrets = JSON.parse(data.SecretString);
        return cachedSecrets;
    }
    throw new Error('SecretString not found in Secrets Manager');
};


exports.handler = async (event) => {
    try {
        console.log('Lambda function invoked with event:', JSON.stringify(event));
        const secrets = await getEmailCredentials();
        const FROM_EMAIL = secrets.from_email;
        const SENDGRID_API_KEY = secrets.sendgrid_api_key;
        // 1. Parse the SNS message
        if (!event.Records || event.Records.length === 0) {
            throw new Error('No Records found in the event.');
        }
        const message = JSON.parse(event.Records[0].Sns.Message);
        const { email, firstName, lastName, userId, token, verificationLink } = message;

        console.log(`Processing verification for user: ${userId}, email: ${email}`);
        sgMail.setApiKey(SENDGRID_API_KEY);
        console.log('SendGrid configured with API Key');
 
        // 2. Compose the verification email
        const msg = {
            to: email,
            from: FROM_EMAIL,
            subject: 'Email Verification',
            html: `
                <p>Please verify your email by clicking the link below:</p>
                <a href="${verificationLink}">${verificationLink}</a>
                <p>This link will expire in 2 minutes.</p>
            `,
        };

        console.log('Composed verification email');

        // 3. Send the email via SendGrid
        console.log('Sending email via SendGrid');
        await sgMail.send(msg);
        console.log(`Verification email sent to ${email}`);

        // 4. Return a successful response
        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Verification email sent successfully.' }),
        };
    } catch (error) {
        console.error('Error sending verification email:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Failed to send verification email.', error: error.toString() }),
        };
    }
};