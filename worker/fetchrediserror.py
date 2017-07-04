import redis, config, webbrowser, uuid
from bs4 import BeautifulSoup

def scrubPII(html):
    soup = BeautifulSoup(html, "html.parser")
    greeting = soup.find("span", {"class": "greeting"})
    greeting.string = "WADDUP EARLY SCORES"
    new_tag = soup.new_tag('base', href='https://apscore.collegeboard.org')
    soup.head.insert(1, new_tag)
    return soup

def main():
    r = redis.StrictRedis(host=config.redisHost)
    errors = r.lrange("error_logs:MinecraftNoobTest", 0, -1)
    for error in errors:
        error = error.decode("UTF-8")
        html = scrubPII(error)
        filePath = "/Users/jacob/Desktop/"
        fileName = str(uuid.uuid4()) + ".html"
        with open(filePath + fileName, "w") as f:
            f.write(html.prettify())
        webbrowser.open("file://"+filePath+fileName)
        print("opening")

if __name__ == "__main__":
    main()
