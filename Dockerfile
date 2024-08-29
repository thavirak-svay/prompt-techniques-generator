# Use an official Golang image as a parent image
FROM golang:1.19-alpine as builder

# Set the working directory inside the container
WORKDIR /app

# Download PocketBase source code and build it
RUN apk add --no-cache git \
    && git clone --depth 1 https://github.com/pocketbase/pocketbase \
    && cd pocketbase \
    && go build -o pocketbase

# Final stage: minimal runtime image
FROM alpine:latest

# Set the working directory inside the container
WORKDIR /app

# Copy the built PocketBase binary from the builder stage
COPY --from=builder /app/pocketbase/pocketbase /app/pocketbase

# Copy any additional static files or configurations (if necessary)
COPY pb_data /app/pb_data
COPY pb_hooks /app/pb_hooks
COPY pb_public /app/pb_public
COPY pb_migrations /app/pb_migrations

# Expose the port that PocketBase will run on
EXPOSE 8090

# Set the command to run PocketBase
CMD ["/app/pocketbase", "serve", "--dir", "/app"]
