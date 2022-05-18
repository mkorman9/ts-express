#!/bin/bash

deployment_name="${DEPLOYMENT_NAME:-ts-express-local-environment}"
namespace="${KUBE_NAMESPACE:-ts-express}"

echo "Shutting down the environment"
helm uninstall "$deployment_name" --namespace="$namespace" || true

kubectl delete configmap db-schema --namespace="$namespace" || true
kubectl delete configmap db-testdata --namespace="$namespace" || true

kubectl delete rabbitmqcluster broker --namespace="messaging" || true

kubectl delete namespace messaging || true
