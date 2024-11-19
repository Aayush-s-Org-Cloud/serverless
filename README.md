Deployment of the Lambda function is managed via Terraform in a separate repository. The general steps involve:
	1.	Packaging the Lambda Function:
	•	Zip the Lambda function code.
	•	Ensure the zip file is accessible, typically uploaded to an S3 bucket.
	2.	Provisioning Infrastructure:
	•	Terraform scripts set up necessary AWS resources, including:
	•	IAM Roles and Policies for Lambda execution.
	•	SNS Topic to trigger the Lambda function.
	•	S3 Bucket for storing deployment artifacts.
	•	The Lambda function itself, referencing the deployment package in S3.
	3.	Deploying via GitHub Actions:
	•	A GitHub Actions workflow in the Lambda function repository packages and uploads the deployment zip to S3.
	•	A separate Terraform workflow applies the Terraform configurations to deploy or update the Lambda function.
