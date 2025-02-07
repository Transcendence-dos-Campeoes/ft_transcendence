#!/bin/sh

# Source the environment variables from the .env file
if [ -f .env ]; then
  export $(cat .env | grep -v '#' | awk '/=/ {print $1}')
fi

# Wait for PostgreSQL container to be ready
until timeout 30 bash -c "echo > /dev/tcp/db/5432" 2>/dev/null
do
  echo "Waiting for PostgreSQL container to be ready..."
  # Sleep for 5 seconds before retrying
  sleep 5
done

# Run the Django management commands
python manage.py makemigrations
python manage.py migrate

# Start Daphne
exec "$@"