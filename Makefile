# **************************************************************************** #
#                                                                              #
#                                                         :::      ::::::::    #
#    Makefile                                           :+:      :+:    :+:    #
#                                                     +:+ +:+         +:+      #
#    By: jaubry-- <jaubry--@student.42lyon.fr>      +#+  +:+       +#+         #
#                                                 +#+#+#+#+#+   +#+            #
#    Created: 2026/03/17 18:40:10 by jaubry--          #+#    #+#              #
#    Updated: 2026/06/09 18:57:20 by jaubry--         ###   ########.fr        #
#                                                                              #
# **************************************************************************** #

SHELL			:= /bin/sh

# Directories
SCRIPTS_DIR		= scripts
CERTS_DIR		= certs

COMPOSE			= docker compose -f compose.yaml

CERTS			= $(CERTS_DIR)/cert.pem \
				  $(CERTS_DIR)/key.pem

DOCKER_ENVFILE	= .env.docker

all: up

setup: $(CERTS) $(DOCKER_ENVFILE)

$(CERTS):
	@rm -rf $(CERTS_DIR)
	@echo "Generating certificates..."
	@sh $(SCRIPTS_DIR)/create-certs.sh
	@echo "Certificates created in $(CERTS_DIR)/"

$(DOCKER_ENVFILE):
	@echo "Generating env file..."
	@bash $(SCRIPTS_DIR)/create-envfile.sh
	@echo "Env file created at $(DOCKER_ENVFILE)"

up: setup
	$(COMPOSE) up -d --build

down:
	$(COMPOSE) down

fclean: down
	rm -rf $(DOCKER_ENVFILE)
	rm -rf $(CERTS_DIR)

prune: fclean
	docker system prune -a -f --volumes

re: fclean all

.PHONY: all setup up down fclean re setup prune
