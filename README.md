# Blindside

## Deploying Blindside

Blindside was developed with Docker Compose / Portainer in mind. So to deploy it.

This is all that is needed to run your own instance:

```yaml
services:
  blindside:
    # The app image to pull. Leave this unchanged if you just want the newest version!
    image: ghcr.io/b4t3s/blindside:latest
    environment:
      # Blindside was created with Discord OAuth for the backend.
      # Other OAuth services might work too, but they're not tested.
      # To set up your oauth client, check out https://discord.com/developers/applications
      OAUTH_CLIENT_ID=<YOUR CLIENT ID>
      OAUTH_CLIENT_SECRET=<YOUR CLIENT SECRET>
      OAUTH_REDIRECT_URI=<YOUR HOST URL ENDING WITH /admin/verify>
      OAUTH_TOKEN_URL=https://discord.com/api/oauth2/token
      SESSION_SECRET=<GENERATE A RANDOM SECRET FOR THIS>
      NODE_ENV=production
      # You can optionally set trust_proxy if you're running the app behind a reverse proxy like traefik or nginx
      # To see how to configure trust_proxy, check out https://expressjs.com/en/5x/guide/behind-proxies/
      # TRUST_PROXY=

    # Bind the required storage volumes
    # You can also use local paths starting with ./ or /
    volumes:
      - database:/app/db # Stores all databases
      - uploads:/app/static/assets/custom/ # Stores uploaded image files

    # Keep the server running, even if the host restarts or the app crashes
    restart: unless-stopped
    
    # Bind container port 3000 to your servers port 80
    # Alternatively, use a proxy like traefik or nginx
    ports:
      - 80:3000

# Set up volumes for everything storage related
volumes:
  database:
  uploads:
```

Save the above into a file called `compose.yaml` and run `docker compose up -d` to start blindside.

Alternatively, if you use Portainer, create a stack with the above config and deploy it.

### Post-Install setup

Once you have blindside running, sh into the container with `docker compose exec blindside sh`. (Or using the portainer exec function)

In the container you can run `npm run admin` to give roles to discord user IDs.

Specifically, run `npm run admin add <your discord ID> ROLE_ADMIN` to make yourself an admin.

You can find out your discord id by enabling the developer mode in discord and then right clicking your name in chat and clicking "Copy User ID".

Once you have become an admin, you can log into the app by going to your instance in the browser and adding `/admin` to the path.

You can manage available medias (games), categories and options from in there!

## Developing locally

To get all the npm packages installed, run `make setup`

After that, run `make up` to start the servers and `make down` to stop them.

If you need to check the logs, run `make logs` to stream them live.

Once the servers are up, the app can be accessed at http://localhost

With the admin panel available at http://localhost/admin

> [!IMPORTANT]
> Don't forget to copy the .env.example to .env and edit it with your oauth information!
