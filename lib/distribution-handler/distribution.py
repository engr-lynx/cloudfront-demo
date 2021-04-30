import boto3
import json
import time

client = boto3.client('cloudfront')
pipeline = boto3.client('codepipeline')

def on_event(event, context):
  user_parameters = json.loads(event['CodePipeline.job']['data']['actionConfiguration']['configuration']['UserParameters'])
  print(user_parameters)
  allFiles = ['/*']
  invalidation = client.create_invalidation(
    DistributionId=user_parameters['distributionId'],
    InvalidationBatch={
      'Paths': {
        'Quantity': 1,
        'Items': allFiles
      },
      'CallerReference': str(time.time())
    }
  )  
  response = pipeline.put_job_success_result(
    jobId=event['CodePipeline.job']['id']
  )
  return response