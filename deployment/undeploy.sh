#!/bin/bash

deployment_name="${DEPLOYMENT_NAME:-ts-express}"
namespace="${KUBE_NAMESPACE:-ts-express}"

echo "Shutting down the deployment of the app"
helm uninstall "$deployment_name" --namespace="$namespace"
