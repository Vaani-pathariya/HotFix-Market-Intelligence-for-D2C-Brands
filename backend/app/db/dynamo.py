import os
import boto3

def get_dynamo_table():
    """
    AWS DynamoDB Integration: Initializes connection to the DynamoDB table 'MarketSenseReviews'
    """
    dynamodb = boto3.resource('dynamodb', region_name=os.environ.get('AWS_DEFAULT_REGION', 'us-east-1'))
    table_name = 'MarketSenseReviews'
    
    try:
        table = dynamodb.Table(table_name)
        table.load() # This will throw an exception if the table doesn't exist
        return table
    except Exception as e:
        # If the table doesn't exist, try to create it here (if permissions allow)
        try:
            table = dynamodb.create_table(
                TableName=table_name,
                KeySchema=[
                    {'AttributeName': 'id', 'KeyType': 'HASH'},    # Partition key
                    {'AttributeName': 'asin', 'KeyType': 'RANGE'}   # Sort key
                ],
                AttributeDefinitions=[
                    {'AttributeName': 'id', 'AttributeType': 'S'},
                    {'AttributeName': 'asin', 'AttributeType': 'S'}
                ],
                ProvisionedThroughput={
                    'ReadCapacityUnits': 5,
                    'WriteCapacityUnits': 5
                }
            )
            # Wait until the table is active
            table.meta.client.get_waiter('table_exists').wait(TableName=table_name)
            return table
        except Exception:
            return None # Fallback to postgres if AWS is not configured
