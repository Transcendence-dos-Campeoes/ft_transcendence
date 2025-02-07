FROM python:3.11.4-slim-buster

WORKDIR /usr/src/app

#set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1  

RUN pip install --upgrade pip
COPY ./requirements.txt .
RUN pip install -r requirements.txt


COPY . .

RUN chmod +x /usr/src/app/entrypoint.sh

ENTRYPOINT ["/usr/src/app/entrypoint.sh"]
CMD ["/usr/local/bin/daphne", "-b", "0.0.0.0", "-p", "8000", "API.asgi:application"]
