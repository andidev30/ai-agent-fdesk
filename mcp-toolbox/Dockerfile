FROM us-central1-docker.pkg.dev/database-toolbox/toolbox/toolbox:0.23.0

WORKDIR /app
COPY tools.yaml .

EXPOSE 5000

CMD ["--tools-file", "tools.yaml", "-a", "0.0.0.0", "-p", "5000"]
