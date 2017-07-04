import json, hashlib, boto3, os, time
from base64 import b64encode

print('Loading function')


def lambda_handler(event, context):
    if "username" not in event or "password" not in event:
        print("Invalid")
    username, password = event["username"], event["password"]

    temp = False
    if "tempUser" in event:
        temp = True

    KEY = hashlib.sha256(username.encode('UTF-8') + ":".encode('UTF-8') + password.encode('UTF-8')).hexdigest()
    #TODO: CONNECT S3
    s3client = boto3.client('s3')
    s3 = boto3.resource('s3')
    bucket = ''

    response = {}
    result = None

    try:
        result = s3.Bucket(bucket).Object(KEY + ".json").get()['Body'].read().decode('utf-8')
    except:
        pass

    if result is None:
        #user hasnt existed yet
        #put them in the SQS
        sqs = boto3.resource('sqs')
        #add to S3 with a status of "added to queue"
        userInfo = dict()
        userInfo['status'] = 0
        if "tempUser" in event:
            userInfo["tempuser"] = True
        userInfo['starttime'] = time.time()
        fileKey = KEY+'.json'
        newObj = s3.Bucket(bucket).Object(fileKey)
        newObj.put(Body=json.dumps(userInfo))
        queue = sqs.get_queue_by_name(QueueName='')
        response = queue.send_message(MessageBody=(username + ":" + password))

        url = s3client.generate_presigned_url('get_object', Params = {'Bucket': bucket, 'Key': fileKey}, ExpiresIn = 100)
        response["success"] = True
        response["score_url"] = url
        response["message"] = "File created. Please wait for your scores."

        return json.dumps(response)
    else:
        result = json.loads(result)

    if result["status"] == 0:
        response["success"] = True
        response["message"] = "Awaiting queue."
        return json.dumps(response)
    elif result["status"] == 1:
        response["success"] = True
        response["message"] = "Fetching scores."
        return json.dumps(response)
    elif result["status"] == -1:
        response["success"] = False
        if "tempuser" in result and result["tempuser"] and "scores" in result:
            url = s3client.generate_presigned_url('get_object', Params = {'Bucket': bucket, 'Key': KEY + ".json"}, ExpiresIn = 100)
            response["tempuser"] = True
            response["score_url"] = url
        response["message"] = "Invalid username and password."
        return json.dumps(response)

    if "tempuser" in result:
            temp = True

    if (time.time() - result["endtime"] > 60) and not (temp):
        sqs = boto3.resource('sqs')
        queue = sqs.get_queue_by_name(QueueName='')
        response = queue.send_message(MessageBody=(username + ":" + password))
        url = s3client.generate_presigned_url('get_object', Params = {'Bucket': bucket, 'Key': KEY + ".json"}, ExpiresIn = 100)
        response["success"] = True
        response["updating"] = True
        response["score_url"] = url
        response["message"] = "Updating stale scores."
        return json.dumps(response)

    url = s3client.generate_presigned_url('get_object', Params = {'Bucket': bucket, 'Key': KEY + ".json"}, ExpiresIn = 100)
    response["success"] = True
    response["score_url"] = url
    response["message"] = "Scores fetched."
    return json.dumps(response)

