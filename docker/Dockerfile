
# Use the base image with Node.js 22.23.2
FROM node:22.23.2

# Copy the current directory into the Docker image
RUN apt-get install -y curl
COPY . /terms-service
# Set working directory for future use
WORKDIR /terms-service

# Install the dependencies from package.json
RUN npm ci
CMD [ "node", "app.js" ]
