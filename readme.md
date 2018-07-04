
# Early Scores
The most popular AP® test score retrieval service, trusted by over seven hundred thousand AP® students. This service is in **no way** affiliated with or endorsed by the College Board®.

## About Early Scores
Early Scores acts as a proxy to allow students to retrieve their scores on July 5th no matter where they are in the world. Retrieving scores poses a unique problem, as students must provide their username and password for the College Board® website in return for highly confidential information. Early Scores aims to make this process as fast and safe as possible, while scaling to support thousands of users simultaneously and providing accurate results. This problem is difficult to solve due to the unknown and uncontrollable variable of the College Board® and their website. 

## How does it work
The following image explains the general flow of information for EarlyScores. The front end of the website is cached in Amazon CloudFront, which will handle all the users we hope to have. Below the image, there is a non-technical walkthrough of how the site works and is secure.

![EarlyScores Service Diagram](https://raw.githubusercontent.com/jbman223/EarlyAP/master/EarlyScoresService.png "How Early Scores works.")

**The non-technical walk-through**
EarlyScores secures your information with industry standard SSL encryption. This information is sent straight to the College Board, and is *never* stored. Then, we forward the College Board response to you, so that you can see your scores. 

## How to use
There are two ways to use Early Scores

 1. Navigate to https://earlyscores.com (See: [How can I ensure my account's safety?](https://github.com/jbman223/EarlyAP/blob/master/readme.md#how-can-i-ensure-my-accounts-safety))
 2. Host your own version of the service.

## Hosting your own
If you would feel more comfortable, feel free to host your own version of Early Scores. EarlyScores is a simple Node.JS app that you can load onto any server and run.

## How can I ensure my account's safety?
You have no reason to worry about the safety of EarlyScores.com hosted service; however, account security should always be a top priority. To ensure your account is absolutely safe when using EarlyScores, you can create a temporary password. Navigate to the College Board website to change your password. After your password is changed, head to EarlyScores.com and log in using your temporary information. After you fetch your scores, head back to the College Board and change your password again.

## What other ways can I check my scores early?
We know that some people will never trust our service. For you, we offer a free SOCKS5 HTTPS proxy which can be found on our website. Also, you can make use of our iPhone app, which is faster than a VPN but offers the same ability for you to see your scores on the first day of their release.


If you have any questions, please ask them in the Github Issues section.

Contributors are extremely welcome!

> AP&reg; is a trademark registered by the College Board, which is not affiliated with, and does not endorse, this site.
