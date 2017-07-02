import requests, boto3, secrets, hashlib, json, secrets, time
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


def findScore(username, password):
    s = requests.Session()
    apNumberRequest = "To successfully match you to your AP exams, the information you enter on this page must be the same as the information you entered on your most recent AP answer sheet."
    scoreUrl = "https://apscore.collegeboard.org/scores/view-your-scores"
    referer = "https://ecl.collegeboard.org/account/login.jsp"

    loginResult = login(s, username, password)

    if not loginResult[0]:
        print("Couldn't log user in.")
        return (False, -1)

    print("Authenticated user.")
    currentPage = loginResult[1]

    scoreResult = fetchScorePage(s, currentPage)
    if not scoreResult[0]:
        if apNumberRequest in scoreResult[1]:
            print("AP Number request.")
            return (False, 7)
        else:
            print("Couldn't navigate to score page.")
            return (False, -2)

    score = getScoreHtml(scoreResult[1])
    if score is not None:
        return (True, score)
    else:
        print("Failed finding scores on page.")
        return (False, -2)


def processUser(username, password):
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

    currentStatus["status"] = 1

    salt = secrets.token_urlsafe(64)
    print(salt)
    currentStatus["salt"] = salt

    secret = generate_key((username + password + password + username).encode("utf-8"), salt.encode("utf-8"), 10000)
    print(secret.hex())

    scoreResult = findScore(username, password)
    if scoreResult[0] is False:
        currentStatus["status"] = scoreResult[1]
    else:
        currentStatus["status"] = 2
        currentStatus["scores"] = AESCipher(secret).encrypt(str(scoreResult[1])).decode("utf-8")

    currentStatus["endtime"] = time.time()

    userFile.put(Body=json.dumps(currentStatus))

while True:
    for message in queue.receive_messages(WaitTimeSeconds=20):
        print("Received message from queue")
        parts = message.body.split(":")
        print(parts)
        processUser(parts[0], parts[1])
        message.delete()