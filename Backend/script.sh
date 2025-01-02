#!/bin/bash
# filepath: /home/masoares/ft_transcendance/Backend/start.sh

# Run the gunicorn command
gunicorn hello_django.wsgi:application --bind 0.0.0.0:8000

# Keep the container running
tail -f /dev/null