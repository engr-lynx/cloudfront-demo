import boto3
import time

client = boto3.client('cloudfront')
pipeline = boto3.client('codepipeline')

def update_handler(event, context):
  print(event)
  allFiles = ['/*']
  invalidation = client.create_invalidation(
    DistributionId='DISTRIBUTION_ID',
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