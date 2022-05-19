# ts-express

## Overview

ts-express is just my personal playground to play with Typescript and Express.js

## Running locally

### Run the dependencies

```sh
docker-compose up
```

This will start Postgres and Redis using docker-compose stack. It will also initialize the database schema and upload some basic data for testing.
<br />
Keep in mind the state of the database and redis will be held between consequitve `docker-compose up` runs. To reset the state run:

```sh
docker-compose down && rm -rf _docker_compose_volumes
```

### Run the app

The app uses yarn to keep track of the external dependencies. When running for the first time remember to execute:

```sh
yarn install

cd frontend/
yarn install
```

Then each time when you want to start the app, simply run:

```sh
yarn start
```

Similarly, if you want to run the frontend, execute:

```sh
cd frontend/
yarn start
```

Then visit `http://localhost:3000`

## Deploy to Kubernetes in Docker Desktop

Requires Helm and Docker Desktop with Kubernetes running
     
Create nginx ingress controller
```bash
helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
helm repo update

kubectl create namespace ingress-nginx

helm install ingress-nginx ingress-nginx/ingress-nginx \
  --namespace=ingress-nginx \
  --set controller.service.externalTrafficPolicy="Local" \
  --set controller.replicaCount=1
  
kubectl wait --namespace ingress-nginx \
  --for=condition=ready pod \
  --selector=app.kubernetes.io/component=controller \
  --timeout=120s
```

Create RabbitMQ cluster operator
```bash
kubectl apply -f "https://github.com/rabbitmq/cluster-operator/releases/latest/download/cluster-operator.yml"
```

Create a namespace for the project
```bash
kubectl create namespace ts-express
kubectl config set-context --current --namespace=ts-express
```

Build app's image
```bash
deployment/build.sh
```

Create development environment for the app (unsuitable for production)
```bash
deployment/kubernetes-env/up.sh
```

Deploy the app
```bash
deployment/deploy.sh
```

Test with `curl -v http://localhost/api/v1/client`

Undeploy the app
```bash
deployment/undeploy.sh
```

Shut down the environment
```bash
deployment/kubernetes-env/down.sh
```

## Deploy to Kubernetes on production

Requires Helm

### Nginx ingress controller
Create nginx ingress controller
```bash
helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
helm repo update

kubectl create namespace ingress-nginx

helm install ingress-nginx ingress-nginx/ingress-nginx \
  --namespace=ingress-nginx \
  --set controller.service.externalTrafficPolicy="Local" \
  --set controller.replicaCount=1
  
kubectl wait --namespace ingress-nginx \
  --for=condition=ready pod \
  --selector=app.kubernetes.io/component=controller \
  --timeout=120s
```

Add additional security headers
```bash
kubectl apply -f - <<EOF
apiVersion: v1
kind: ConfigMap
metadata:
  name: security-headers
  namespace: ingress-nginx
data:
  X-Frame-Options: "DENY"
  X-Content-Type-Options: "nosniff"
  X-XSS-Protection: "0"
  Strict-Transport-Security: "max-age=63072000; includeSubDomains; preload"
---
apiVersion: v1
kind: ConfigMap
metadata:
  name: ingress-nginx-controller
  namespace: ingress-nginx
  labels:
    app.kubernetes.io/name: ingress-nginx
    app.kubernetes.io/part-of: ingress-nginx
data:
  add-headers: "ingress-nginx/security-headers"
EOF
```

### RabbitMQ cluster operator

Create RabbitMQ cluster operator
```bash
kubectl apply -f "https://github.com/rabbitmq/cluster-operator/releases/latest/download/cluster-operator.yml"
```

### Project namespace

Create a namespace for the project
```bash
kubectl create namespace ts-express
kubectl config set-context --current --namespace=ts-express
```

### Access to Gitlab registry

- Generate a Gitlab personal access token with `read_registry` scope
- Generate AUTH_STRING with `echo -n '<USERNAME>:<ACCESS_TOKEN>' | base64`
- Create a `docker.json` file
```
{
    "auths": {
        "registry.gitlab.com": {
            "auth": "<AUTH_STRING>"
        }
    }
}
```

Upload it to the cluster
```bash
kubectl create secret generic gitlab-docker-registry --namespace=kube-system \
--from-file=.dockerconfigjson=./docker.json --type="kubernetes.io/dockerconfigjson"
```

### RabbitMQ cluster

Create a namespace for the broker
```bash
kubectl create namespace messaging
```

Create `broker.yml` file. Adjust deployment parameters such as CPU, memory and disk quota.
Additionally, `storageClassName` can be defined under `persistance`to specify type of storage to deploy.
You can get a list of supported storage classes by running `kubectl get storageclass`     
(**NOTE:** Replicas count must be an odd number: 1, 3, 5, 7 etc.)
```
apiVersion: rabbitmq.com/v1beta1
kind: RabbitmqCluster
metadata:
  name: broker
  namespace: messaging
spec:
  replicas: 1
  resources:
    requests:
      cpu: 1000m
      memory: 2Gi
    limits:
      cpu: 2000m
      memory: 2Gi
  persistence:
    storage: 5Gi
```

Deploy it
```
kubectl apply -f broker.yml
```

Retrieve default username and password
```bash
kubectl get secret broker-default-user --namespace=messaging -o jsonpath='{.data.username}' | base64 --decode
kubectl get secret broker-default-user --namespace=messaging -o jsonpath='{.data.password}' | base64 --decode
```

Retrieved credentials can be used to access the management console.
Open a tunnel with
```bash
kubectl port-forward service/broker --namespace=messaging 15672:15672
```

Open `http://localhost:15672` in a browser and log in.     
Then create new user under `Admin -> Users` and assign him permissions under
`Admin -> Virtual Host -> /`. Use his credentials to construct the URL
```
amqp://<username>:<password>@broker.messaging.svc.cluster.local:5672/
```

### App secrets

Create `secrets.yml` file and populate it with data
```
database:
  uri: postgres://<POSTGRES_USERNAME>:<POSTGRES_PASSWORD>@<POSTGRES_HOST>:5432/<POSTGRES_DB_NAME>
amqp:
  uri: <RABBITMQ_URL>
```

Upload it
```bash
kubectl create secret generic secrets --from-file=secrets.yml
```

### TLS certificate

Either generate a self-signed cert

```bash
export DOMAIN="example.com"
openssl req -x509 -nodes -days 365 -newkey rsa:4096 -keyout key.pem -out cert.pem -subj "/CN=$DOMAIN/O=$DOMAIN"
```

Or use Let's Encrypt to generate a proper one
```bash
# brew install certbot
export DOMAIN="example.com"
sudo certbot -d "$DOMAIN" --manual --preferred-challenges dns certonly
sudo cp "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" ./cert.pem && sudo chown $USER ./cert.pem
sudo cp "/etc/letsencrypt/live/$DOMAIN/privkey.pem" ./key.pem && sudo chown $USER ./key.pem

# to renew later: sudo certbot renew -q
```

Upload it
```bash
kubectl create secret tls domain-specific-tls-cert --key key.pem --cert cert.pem
```

### Deploy

Set proper values for flags and run
```bash
deployment/deploy.sh \
  --set app.version="v1.0.4" \
  --set app.imageName="registry.gitlab.com/mkorman/ts-express" \
  --set images.pullSecret="kube-system/gitlab-docker-registry" \
  --set ingress.hostname="example.com" \
  --set ingress.useHttps=true \
  --set ingress.tlsCertName="domain-specific-tls-cert"
```

Undeploy the app later
```bash
deployment/undeploy.sh
```
