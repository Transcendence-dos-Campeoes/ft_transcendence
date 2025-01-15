# ft_transcendence

## Backend
After making changes to the database models, we need to run:

### Apply database migrations
```bash
    python manage.py makemigrations 
    python manage.py migrate
```

During execution run:
```bash
    docker-compose exec database python manage.py makemigrations
    docker-compose exec database python manage.py migrate
```

### psycopg2
It is a Database Adapter
    We need this application to be able to run SQL commads using django without writing them in SQL.
    The adapter handles the complexity of communicating with the database, and it ensures efficient and secure interaction with your database.
    It is one of the best ways to avoid SQL injections when querying a database. Database adapters provide mechanisms to safely construct and execute SQL queries, such as parameterized queries, which are specifically designed to prevent SQL injection attacks


### WSGI - Gunicorn
You need a WSGI server like Gunicorn to run Django applications in a production environment because Django (and other Python web frameworks) rely on the WSGI (Web Server Gateway Interface) standard to communicate with web servers and handle HTTP requests.
    It defines how a web server forwards HTTP requests to a Python application and receives the application's responses.
    Django provides a WSGI application (your_project.wsgi:application), which acts as the entry point for web servers. However, it doesn’t include a production-ready WSGI server - Django's built-in runserver is designed for development purposes.

A WSGI server like Gunicorn is necessary because:

        *   Web servers like Nginx or Apache cannot directly execute Python code.
        *   Gunicorn acts as a bridge between Nginx (or other reverse proxies) and your Django application 
        *   Gunicorn can run multiple worker processes, enabling your application to handle multiple simultaneous requests.

A typical Django deployment with Gunicorn looks like this:

    1. Client sends an HTTP request.
    2. Nginx (Reverse Proxy):
        Handles the incoming request.
        Serves static files (like CSS, JS, images) directly for efficiency.
        Forwards the dynamic request (e.g., /api/) to Gunicorn.
    3. Gunicorn (WSGI Server):
        Receives the HTTP request from Nginx.
        Passes it to Django's WSGI application.
        Returns the response to Nginx.
    4. Nginx sends the final response back to the client.

## Docker-Compose for production

A version of the docker was created for production taht configures gunicorn and nginx.
This allows the application to handle multiple simultaneous requests.
Running backend as a non-root user