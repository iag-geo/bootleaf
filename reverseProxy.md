This article explains how to set up a reverse proxy, using the free web server nginx.

Certain HTTP requests require the presence of a reverse proxy, which acts as a go-between for the web browser and the server. This may be the case when requesting data from GeoServer.

# Installation

## Windows

Download nginx for windows from http://nginx.org/en/docs/windows.html then open the config file under `\conf\nginx.conf`.

## Mac

Use [Homebrew](https://coderwall.com/p/dgwwuq/installing-nginx-in-mac-os-x-maverick-with-homebrew) to install nginx then open the config file at `/usr/local/etc/nginx/nginx.conf`

# Configuration

Under the server section, specify the port on which to listen (eg 8080) and the name of the server:

```
server {
  listen 8080;
  server_name localhost;
```

Specify that all requests on this machine should pass via the reverse proxy to the native web server (running on port 80):

```
  location / {
    proxy_pass http://localhost:80/;
  }
```

# Bootleaf and GeoServer

In order to retrieve data from GeoServer in a Bootleaf application, it may be necessary to access the data via the reverse-proxy, due to cross-origin issues.

Add the following to your nginx.conf file:

```
  location /proxied_geoserver/ {
    proxy_pass http://path.to.your.geoserver:8080/geoserver/;
  }
```

Then within your Bootleaf application's config.js file, specify the URL to GeoServer layers using the above string, eg:

```
  {
    "id": "YourLayerId",
    "name": "Your Layer Name",
    "type": "wmsTiledLayer",
    "url": '/proxied_geoserver/wms',
    .....
  }
```

Access your Bootleaf app via port 8080 in order to send the above requests via the reverse-proxy, eg http://localhost:8080/bootleaf/
