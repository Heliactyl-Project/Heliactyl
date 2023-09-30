![Heliactyl](https://media.discordapp.net/attachments/1000768414220038204/1157727962569900192/Heliactyl-preview.png)

<hr>

# Heliactyl v13

All features:
- Resource Management (Use it to create servers, etc)
- Coins (AFK Page earning, Linkvertise earning, Gift them away)
- Renewal (Require coins for renewal)
- Coupons (Gives resources & coins to a user)
- Servers (create, view, edit servers)
- Payments (buy via stripe)
- Login Queue (prevent overload)
- User System (auth, regen password, etc)
- Store (buy resources with coins)
- Dashboard (view resources)
- Join for Rewards (join discord servers for coins)
- Admin (set/add/remove coins & resources, create/revoke coupons)
- API (for bots & other things)

# Warning

We cannot force you to keep the "Powered by Heliactyl" in the footer, but please consider keeping it. It helps getting more visibility to the project and so getting better. We won't provide technical support for installations without the notice in the footer. We may file a DMCA takedown if the website using our Software shares false information or proclaims to be the Software Developers.

We kindly ask you to keep the footer :)

<hr>

# Install Guide

Warning: You need Pterodactyl already set up on a domain for Heliactyl to work
1. Upload the file above onto a Pterodactyl NodeJS server [Download the egg from Parkervcp's GitHub Repository](https://github.com/parkervcp/eggs/tree/master/bots/discord/discord.js)
2. Unarchive the file and set the server to use NodeJS 16
3. Configure settings.json (specifically panel domain/apikey and discord auth settings for it to work)
4. Start the server (Ignore the 2 strange errors that might come up)
5. Login to your DNS manager, point the domain you want your dashboard to be hosted on to your VPS IP address. (Example: dashboard.domain.com 192.168.0.1)
6. Run `apt install nginx && apt install certbot` on the vps
7. Run `ufw allow 80` and `ufw allow 443` on the vps
8. Run `certbot certonly -d <Your Heliactyl Domain>` then do 1 and put your email
9. Run `nano /etc/nginx/sites-enabled/heliactyl.conf`
10. Paste the configuration at the bottom of this and replace with the IP of the pterodactyl server including the port and with the domain you want your dashboard to be hosted on.
11. Run `systemctl restart nginx` and try open your domain.

# Nginx Proxy Config
```Nginx
server {
    listen 80;
    server_name <domain>;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;

    location /afkwspath {
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_pass "http://localhost:<port>/afkwspath";
    }
    
    server_name <domain>;
    ssl_certificate /etc/letsencrypt/live/<domain>/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/<domain>/privkey.pem;
    ssl_session_cache shared:SSL:10m;
    ssl_protocols SSLv3 TLSv1 TLSv1.1 TLSv1.2;
    ssl_ciphers  HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    location / {
      proxy_pass http://localhost:<port>/;
      proxy_buffering off;
      proxy_set_header X-Real-IP $remote_addr;
  }
}
```

<hr>

# Additional Configuration

Enabling other eggs (Minecraft Bedrock):
1. [Download the eggs from Parkervcp's GitHub Repository](https://github.com/parkervcp/eggs/tree/master/bots/discord/discord.js)
2. Add the Pocketmine & Vanilla Bedrock eggs to your panel
3. Get the egg ID of both of them and set it as the ID in settings.json

# Updating 

From Heliactyl v11/v12 or Dashactyl v0.4 to Heliactyl v13:
1. Store certain things such as your api keys, discord auth settings, etc in a .txt file
2. Download database.sqlite 
3. Delete all files off the server (or delete and remake the folder if done in ssh)
4. Upload the latest Heliactyl v13 release and unzip it
5. Upload database.sqlite and reconfigure settings.json

Move to a newer Heliactyl v13 release:
1. Delete everything except settings.json, database.sqlite
2. Put the files that you didn't delete into a zip file
3. Upload the latest Heliactyl v13 release and unzip it
4. Remove settings.json and database.sqlite
5. Unzip the zip with your old settings.json and database.sqlite

# Running in background and on startup
Installing [pm2](https://github.com/Unitech/pm2):
- Run `npm install pm2 -g` on the vps

Starting the Dashboard in Background:
- Change directory to your Heliactyl folder Using `cd` command, Example: `cd /var/www/heliactyl` 
- To run Heliactyl, use `pm2 start index.js --name "heliactyl"`
- To view logs, run `pm2 logs Heliactyl`

Making the dashboard runs on startup:
- Make sure your dashboard is running in the background with the help of [pm2](https://github.com/Unitech/pm2)
- You can check if Heliactyl is running in background with `pm2 list`
- Once you confirmed that Heliactyl is running in background, you can create a startup script by running `pm2 startup` and `pm2 save`
- Note: Supported init systems are `systemd`, `upstart`, `launchd`, `rc.d`
- To stop your Heliactyl from running in the background, use `pm2 unstartup`

To stop a currently running Heliactyl instance, use `pm2 stop heliactyl`

# Legacy Deprecation Notice

Heliactyl Version v6 to - v12 have now reached their EOL (End Of Life) and should not be used in Production.
Please update to Heliactyl v12 LTS or v13.

