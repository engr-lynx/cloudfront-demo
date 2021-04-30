from time import time
from json import dumps, loads, JSONDecodeError
from logging import getLogger, INFO
from boto3 import client
from botocore.exceptions import ClientError

logger = getLogger()
logger.setLevel(INFO)

cf = client('cloudfront')
cp = client('codepipeline')

def on_event(event, context):
  logger.info('Received event: %s' % dumps(event))
  cp_job = event['CodePipeline.job']
  job_id = cp_job['id']
  user_parameters_str = cp_job['data']['actionConfiguration']['configuration']['UserParameters']
  all_files = ['/*']
  time_reference = str(time()).replace('.', '')
  try:
    user_parameters = loads(user_parameters_str)
    invalidation = cf.create_invalidation(
      DistributionId=user_parameters['distributionId'],
      InvalidationBatch={
        'Paths': {
          'Quantity': 1,
          'Items': all_files
        },
        'CallerReference': time_reference
      }
    )
    cp.put_job_success_result(jobId=job_id)
  except ClientError as e:
    logger.error('Error: %s', e)
    cp.put_job_failure_result(
      jobId=job_id,
      failureDetails={
        'type': 'JobFailed',
        'message': e.response['Error']['Message']
      }
    )
  except JSONDecodeError as e:
    logger.error('Error: %s', e)
    cp.put_job_failure_result(
      jobId=job_id,
      failureDetails={
        'type': 'ConfigurationError',
        'message': e.msg
      }
    )
  return