FROM jupyter/base-notebook:latest

USER root

# Install Node.js 20.x
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Install tslab globally
RUN npm install -g tslab

# Switch back to the default Jupyter user
USER ${NB_UID}

# Register TypeScript and JavaScript kernels for this user
RUN tslab install --python=python3
