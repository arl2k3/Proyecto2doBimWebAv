# BetZone Kubernetes manifests
#
# Apply order:
#   kubectl apply -f k8s/namespace.yaml
#   kubectl apply -f k8s/configmap.yaml
#   kubectl apply -f k8s/secrets.yaml
#   kubectl apply -f k8s/databases.yaml
#   kubectl apply -f k8s/rabbitmq.yaml
#   kubectl apply -f k8s/services.yaml
#   kubectl apply -f k8s/monitoring.yaml
#   kubectl apply -f k8s/ingress.yaml
#
# Or apply all at once:
#   kubectl apply -f k8s/
#
# Before deploying, replace ghcr.io/OWNER/* image placeholders with your registry.
