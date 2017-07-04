
# Early Scores
The most popular AP® test score retrieval service, trusted by over a hundred thousand AP® students. This service is in **no way** affiliated with or endorsed by the College Board®.

## About Early Scores
Early Scores acts as a proxy to allow students to retrieve their scores on July 5th no matter where they are in the world. Retrieving scores poses a unique problem, as students must provide their username and password for the College Board® website in return for highly confidential information. Early Scores aims to make this process as fast and safe as possible, while scaling to support thousands of users simultaneously and providing accurate results. This problem is difficult to solve due to the unknown and uncontrollable variable of the College Board® and their website. 

## How does it work
The following image explains the general flow of information for EarlyScores. The front end of the website is cached in Amazon CloudFront, which will handle all the users we hope to have.

**The non-technical walk-through**
I will try to explain how Early Scores works in the simplest, most non technical way possible. As previously mentioned, security is the number one priority of this site. We want to make sure that only you have access to only your scores. How we do it can be easily put into simple comparisons. Imagine Early Scores, instead of a website, as a shop. First, the shop has many rooms for each customer, and nobody else can hear what happens in these rooms (this is [https communication over the web](https://en.wikipedia.org/wiki/HTTPS)). In this room, there is an Early Scores agent who is responsible for fetching your scores. Luckily, we invented a special technology to clear the agent's brain after you are done with them. This will be important later. In the private room, you give the agent a box that you have the key to, and the box is very unique and surely yours (This is the [hash](https://en.wikipedia.org/wiki/Hash_function) of your username and password). The key to open this box was created using a pattern found in your username and password, but you could never look at the pattern on someone else's key and figure out their username and password. You tell the agent the instructions to get your scores (logging in with your College Board username and password). Remember, nobody else can listen in to this secure room, so your information is safe. You give the agent your box, but keep the key so that only you can see what is inside. The agent fills the box with your scores, and shuts it. Then the box is sent to the reception room, waiting for you to open it. The agent's memory is erased, and they are ready for the next customer, meanwhile, your score has been waiting at the front desk for you. Luckily, only your key can see the scores inside your locked box ([private key encryption](https://en.wikipedia.org/wiki/Encryption)), so you know nobody else looked at your scores. You also know that since the agent's memory was erased, nobody learned your username and password in the process. Finally, you know you and only you can easily describe your box to the front desk attendant because it is so unique to you. **Then**

**If you are using temporary password mode:**
Also, you can always go back and get a box you had previously stored (temporary password mode) as long as you still have the key (temporary password) and remember how to describe the box (username and temporary password) because you don't ever ask the agent to refill it.

**Otherwise:**
 That is essentially how Early Scores performs its score fetching. 

Sorry if this was extremely hard to understand and makes no sense!

## How to use
There are two ways to use Early Scores

 1. Navigate to https://earlyscores.com (See: [How can I ensure my account's safety?](https://github.com/jbman223/EarlyAP/blob/master/readme.md#how-can-i-ensure-my-accounts-safety))
 2. Host your own version of the service.

## Hosting your own
If you would feel more comfortable, feel free to host your own version of Early Scores. The folder `/old` contains the simple, non-distributed workflow that sustained the early days of the site. Simply place `/old` on any web server that runs PHP, and your scores will be fetched all on your own server. 
If you want to host the distributed version, contact me. It too me many long hours to get all of the AWS providers working together and there's no way I can describe it here.

## How can I ensure my account's safety?
You have no reason to worry about the safety of EarlyScores.com hosted service; however, account security should always be a top priority. To ensure your account is absolutely safe when using EarlyScores, you can create a temporary password. Navigate to the College Board website to change your password. After your password is changed, head to EarlyScores.com and log in using your temporary information. Before you click the green button, click the Advanced Settings link. Using the check mark,  click the "Fetch using temporary password mode." This mode allows you to continue to look at your scores using your temporary password rather than your real College Board account, even after you change your password. After your scores have been fetched by the system, change your username and password. This way, the password you entered into our service is different from your real password. 

## How does temporary password mode work?
Scores are fetched and encrypted using the username and password you enter in to EarlyScores. Using industry standard [hashing](https://en.wikipedia.org/wiki/Hash_function) and [encryption](https://en.wikipedia.org/wiki/Encryption) algorithms, your scores are uniquely identifiable to your account, while never actually knowing the details of your account. Because the distributed system holds your files for 1 day before they expire, you could use the temporary username and password to access your encrypted and previously fetched scores while your College Board account's password is no longer the same. 

If you have any questions, please ask them in the Github Issues section.

Contributors are extremely welcome!

> AP&reg; is a trademark registered by the College Board, which is not affiliated with, and does not endorse, this site.
