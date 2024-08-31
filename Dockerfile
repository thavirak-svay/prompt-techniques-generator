FROM alpine:latest

ARG PB_VERSION=0.22.20

RUN apk add --no-cache \
    unzip \
    ca-certificates

ADD https://github.com/pocketbase/pocketbase/releases/download/v${PB_VERSION}/pocketbase_${PB_VERSION}_linux_amd64.zip /tmp/pb.zip
RUN unzip /tmp/pb.zip -d /pb/ && \
    rm /tmp/pb.zip

# Create a non-root user to run PocketBase
RUN addgroup -S pocketbase && adduser -S pocketbase -G pocketbase

# Create necessary directories
RUN mkdir -p /pb/pb_data /pb/pb_migrations /pb/pb_hooks /pb/public && \
    chown -R pocketbase:pocketbase /pb

# Copy application files
COPY --chown=pocketbase:pocketbase ./pb_migrations /pb/pb_migrations
COPY --chown=pocketbase:pocketbase ./pb_hooks /pb/pb_hooks
COPY --chown=pocketbase:pocketbase ./pb_public /pb/public

# Set the working directory
WORKDIR /pb

# Expose the PocketBase port
EXPOSE 8080

# Switch to the non-root user
USER pocketbase

# Run PocketBase
CMD ["/pb/pocketbase", "serve", "--http=0.0.0.0:8080"]