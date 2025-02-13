# Build and run the Docker containers
all: up

# Build and run the Docker containers
up:
	@if [ ! -d "${PWD}/Database/" ]; then \
		mkdir -p ${PWD}/Database/; \
	fi
	@if [ ! -d "${PWD}/Backend/media/profile_images/" ]; then \
		mkdir -p ${PWD}/Backend/media/profile_images; \
	fi
	@if [ ! -d "${PWD}/Contracts/node_modules/" ]; then \
		cd ${PWD}/Contracts/; \
		npm install; \
		cd ..; \
	fi
	wget --output-document=${PWD}/Backend/media/profile_images/default.jpg https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png
	docker-compose up --build

# Stop and remove the Docker containers
down:
	docker-compose down

# Stop and remove the Docker containers, volumes, and networks
clean:
	docker-compose down -v --rmi all --remove-orphans

# Remove all Docker images
clean-images:
	docker rmi $$(docker images -q)

# Remove all Docker containers
clean-containers:
	docker rm $$(docker ps -a -q)

# Remove all Docker volumes
clean-volumes:
	docker volume rm $$(docker volume ls -q)

# Remove all Docker networks
clean-networks:
	docker network rm $$(docker network ls -q)

# Restart the Docker containers
restart: down up

# View logs of the Docker containers
logs:
	docker-compose logs -f

.PHONY: all up down clean clean-images clean-containers clean-volumes clean-networks restart logs