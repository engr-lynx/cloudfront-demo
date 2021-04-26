import json
import logging
import boto3
from botocore.exceptions import ClientError

logger = logging.getLogger()
logger.setLevel(logging.INFO)

cloudfront = boto3.client('cloudfront')

def on_event(event, context):
  logger.info('Received event: %s' % json.dumps(event))
  request_type = event['RequestType']
  if request_type == 'Create': return on_create(event)
  if request_type == 'Update': return on_create(event)
  if request_type == 'Delete': return on_delete(event)
  raise Exception('Invalid request type: %s' % request_type)

def on_create(event):
  distribution_id = event['ResourceProperties']['DistributionId']
  try:
    subscribe(distribution_id)
  except ClientError as e:
    logger.error('Error: %s', e)
    raise e
  return

def on_delete(event):
  distribution_id = event['ResourceProperties']['DistributionId']
  try:
    unsubscribe(distribution_id)
  except ClientError as e:
    logger.error('Error: %s', e)
    raise e
  return

def subscribe(distribution_id):
  cloudfront.get_distribution_config(
    Id=distribution_id
  )
  return

def unsubscribe(distribution_id):
  cloudfront.get_distribution_config(
    Id=distribution_id
  )
  return
