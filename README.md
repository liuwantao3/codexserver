# Build and Deploy Your Own ChatGPT AI Application That Will Help You Code
Publish static website to Github pages:
Remove "dist" directory from .gitignore then execute this command:
git subtree push --prefix dist origin gh-pages

Use VS code to publish and deploy applications to Azure Web App. For Node app, always listen on port 8080, because of the nature that Web App is based on Docker.

Changed model from GPT 3.5 to GPT 4 by changing the deploymentId in chat.js.