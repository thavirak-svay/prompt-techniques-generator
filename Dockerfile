# Use the PocketBase image as the base
FROM ghcr.io/muchobien/pocketbase:latest

# Set the working directory
WORKDIR /app

# Copy the data, hooks, public, and migrations directories
COPY ./pb_data /pb_data
COPY ./pb_hooks /pb_hooks
COPY ./pb_public /pb_public
COPY ./pb_migrations /pb_migrations

# Expose the port PocketBase will run on
EXPOSE 8090

# Start the PocketBase server
CMD ["serve", "--dir", "/app", "--data", "/pb_data", "--hooks", "/pb_hooks", "--public", "/pb_public", "--migrations", "/pb_migrations"]
