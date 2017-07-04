import requests, boto3, uuid, hashlib, json, time, config, redis, sys
from bs4 import BeautifulSoup
from base64 import b64decode
from base64 import b64encode
from Crypto import Random
from Crypto.Cipher import AES

# Padding for the input string --not
# related to encryption itself.
BLOCK_SIZE = 16  # Bytes
pad = lambda s: s + (BLOCK_SIZE - len(s) % BLOCK_SIZE) * \
                chr(BLOCK_SIZE - len(s) % BLOCK_SIZE)
unpad = lambda s: s[:-ord(s[len(s) - 1:])]


STATUS_CODES = {
    -4: "Accept terms and conditions.",
    -3: "No scores available.",
    -2: "Unknown invalid fetch attempt",
    -1: "Invalid College Board Account",
    0: "Entered into queue",
    1: "Fetching Scores",
    2: "Success",
    7: "AP Number Requested"
}

class AESCipher:
    """
    Usage:
        c = AESCipher('password').encrypt('message')
        m = AESCipher('password').decrypt(c)
    Tested under Python 3 and PyCrypto 2.6.1.
    """

    def __init__(self, key):
        self.key = key

    def encrypt(self, raw):
        raw = pad(raw)
        iv = Random.new().read(AES.block_size)
        cipher = AES.new(self.key, AES.MODE_CBC, iv)
        return b64encode(iv + cipher.encrypt(raw))

    def decrypt(self, enc):
        enc = b64decode(enc)
        iv = enc[:16]
        cipher = AES.new(self.key, AES.MODE_CBC, iv)
        return unpad(cipher.decrypt(enc[16:])).decode('utf8')

s3 = boto3.resource('s3')
sqs = boto3.resource('sqs')

queue = sqs.get_queue_by_name(QueueName='')
bucket = ''

def broadcastChatMessage(r, message):
    message = "["+config.server_name+"]: " + str(message)
    try:
        r.publish(config.channel, message)
    except:
        pass

def scrubPII(html):
    soup = BeautifulSoup(html, "html.parser")
    greeting = soup.find("span", {"class": "greeting"})
    greeting.string = "WADDUP EARLY SCORES"
    new_tag = soup.new_tag('base', href='https://apscore.collegeboard.org')
    soup.head.insert(1, new_tag)
    return soup

def getScoreHtml(html):
    soup = BeautifulSoup(html, "html.parser")
    scoresContainers = soup.find_all("div", id="scoresListArea")
    if len(scoresContainers) == 1:
        return scoresContainers[0]
    else:
        return None

def generate_key(password, salt, iterations):
    assert iterations > 0

    key = password + salt

    for i in range(iterations):
        key = hashlib.sha256(key).digest()

    return key

def followMetaRedirects(s, resp, headers, current = 0, max_redirects = 10, redirectUrl = "http://governor.collegeboard.org"):
    if current >= max_redirects: return resp
    print("Following redirect", current)
    soup = BeautifulSoup(resp, "html.parser")
    refresh = soup.find("meta", attrs={"http-equiv": "refresh"})
    if refresh:
        print("Identified meta page.")
        redirectUrl += refresh["content"][6:]
        headers["Referer"] = redirectUrl
        r = s.get(redirectUrl, headers=headers)
        return followMetaRedirects(s, r.text, headers, current = current + 1, max_redirects = max_redirects, redirectUrl = redirectUrl)
    else:
        print("Identified real page.")
        return resp

def login(s, username, password):
    loginUrl = "https://account.collegeboard.org/login/authenticateUser"
    referer = "https://ecl.collegeboard.org/account/login.jsp"
    form = {
        'idp': 'ECL',
        'isEncrypted': 'N',
        'DURL': 'https://apscore.collegeboard.org/scores/view-your-scores',
        'password': password,
        'username': username,
        'appId': 287,
        'formState': 1
    }
    headers = {
        'Referer': referer,
        'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/40.0.2214.85 Safari/537.36'
    }
    r = s.post(loginUrl, data=form, headers=headers)
    resp = followMetaRedirects(s, r.text, headers)
    loggedInJs = 'var userLoggedin = true;'
    if loggedInJs in resp:
        return (True, resp)
    else:
        return (False, resp)


def fetchScorePage(s, resp, max_tries = 3, count = 0):
    if count >= max_tries: return (False, resp)
    scoreUrl = "https://apscore.collegeboard.org/scores/view-your-scores"
    scoreJs = "activateMenuItems('/scores', '/scores/view-your-scores');"
    referer = "https://ecl.collegeboard.org/account/login.jsp"
    headers = {
        'Referer': referer,
        'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/40.0.2214.85 Safari/537.36'
    }
    if scoreJs in resp:
        return (True, resp)
    else:
        r = s.get(scoreUrl, headers=headers)
        resp = followMetaRedirects(s, r.text, headers)
        return fetchScorePage(s, resp, max_tries = max_tries, count = count + 1)


def findScore(r, username, password):
    s = requests.Session()
    apNumberRequest = "To successfully match you to your AP exams, the information you enter on this page must be the same as the information you entered on your most recent AP answer sheet."
    tosRequest = "To view and send your AP Scores, you'll need to review and accept these Terms and Conditions."
    noScoresAvailable = "No scores available"

    scoreUrl = "https://apscore.collegeboard.org/scores/view-your-scores"
    referer = "https://ecl.collegeboard.org/account/login.jsp"

    loginResult = login(s, username, password)

    if not loginResult[0]:
        try:
            r.incr("servers:"+config.server_name+":login_fail_count")
        except:
            pass
        print("Couldn't log user in.")
        return (False, -1)

    print("Authenticated user.")
    currentPage = loginResult[1]

    scoreResult = fetchScorePage(s, currentPage)
    if not scoreResult[0]:
        if apNumberRequest in scoreResult[1]:
            print("AP Number request.")
            try:
                r.incr("servers:"+config.server_name+":ap_number_error")
            except:
                pass
            return (False, 7)
        elif tosRequest in scoreResult[1]:
            try:
                r.incr("servers:"+config.server_name+":tos_request_error")
            except:
                pass
            return (False, -4)
        elif noScoresAvailable in scoreResult[1]:
            try:
                r.incr("servers:"+config.server_name+":no_scores_available_error")
            except:
                pass
            return (False, -3)
        else:
            print("Couldn't navigate to score page.")
            try:
                r.incr("servers:"+config.server_name+":score_page_navigation_error")
                r.lpush("error_logs:"+config.server_name, scrubPII(scoreResult[1]))
            except:
                print("Error logging connection error.")
            return (False, -2)

    score = getScoreHtml(scoreResult[1])
    if score is not None:
        return (True, score)
    elif tosRequest in scoreResult[1]:
        try:
            r.incr("servers:"+config.server_name+":tos_request_error")
        except:
            pass
        return (False, -4)
    elif noScoresAvailable in scoreResult[1]:
        try:
            r.incr("servers:"+config.server_name+":no_scores_available_error")
        except:
            pass
        return (False, -3)
    else:
        print("Failed finding scores on page.")
        try:
            r.incr("servers:"+config.server_name+":loading_scores_error")
            r.lpush("error_logs:"+config.server_name, scrubPII(scoreResult[1]))
        except:
            print("Error logging connection error.")
        return (False, -2)


def processUser(r, username, password):
    KEY = hashlib.sha256(username.encode('UTF-8') + ":".encode('UTF-8') + password.encode('UTF-8')).hexdigest()
    FILEKEY = KEY + ".json"
    userFile = None

    print(KEY)

    userFile = s3.Bucket(bucket).Object(KEY + ".json")

    currentStatus = None
    try:
        currentStatus = json.loads(userFile.get()['Body'].read().decode('utf-8'))
    except:
        pass


    if currentStatus is None:
        print("User file read error.")
        return False

    timing = True
    if currentStatus["status"] == 2:
        timing = False

    currentStatus["status"] = 1

    salt = str(uuid.uuid4())
    currentStatus["salt"] = salt

    secret = generate_key((username + password + password + username).encode("utf-8"), salt.encode("utf-8"), 10000)

    scoreResult = findScore(r, username, password)
    if scoreResult[0] is False:
        currentStatus["status"] = scoreResult[1]
        try:
            r.incr("servers:"+config.server_name+":errors")
        except:
            pass
    else:
        currentStatus["status"] = 2
        currentStatus["scores"] = AESCipher(secret).encrypt(str(scoreResult[1])).decode("utf-8")
        try:
            r.incr("servers:"+config.server_name+":successes")
        except:
            pass

    currentStatus["endtime"] = time.time()
    currentStatus["elapsedTime"] = "Score fetched in " + str(currentStatus["endtime"] - currentStatus["starttime"]) + " seconds."
    try:
        if timing:
            r.lpush("timing:"+config.server_name, currentStatus["endtime"] - currentStatus["starttime"])
        else:
            currentStatus["elapsedTime"] = "Fetched score quickly."
            print("Untimed, refreshed previous score.")
    except:
        print("Error logging connection error.")

    userFile.put(Body=json.dumps(currentStatus))

def prodLoop(r):
    print("Started")
    while True:
        try:
            killList = r.smembers("kill_list")
            for member in killList:
                member = member.decode("UTF-8")
                if member == config.server_name:
                    sys.exit()
        except:
            pass
        for message in queue.receive_messages(WaitTimeSeconds=20):
            try:
                print("Received message from queue")
                parts = message.body.split(":")
                processUser(r, parts[0], parts[1])
                r.incr("fetch_count")
                r.incr("servers:"+config.server_name+":fetch_count")
                message.delete()
            except:
                r.incr("error_logs:"+config.server_name+":fatal_count")
                message(r, "I just experienced a fatal error.")

def mockLoop(r):
    try:
        message = input("Received message from queue")
        parts = message.split(":")
        processUser(r, parts[0], parts[1])
    except:
        r.incr("error_logs:"+config.server_name+":fatal_count")
        message(r, "I just experienced a fatal error!")


def main():
    r = redis.StrictRedis(host=config.redisHost)
    print("EarlyScores worker starting up.")
    print("Worker Name:", config.server_name)
    r.sadd("server_list", config.server_name)
    prodLoop(r)
    #mockLoop(r)




if __name__ == "__main__":
    main()
