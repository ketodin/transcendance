#!/bin/sh

if [ ! -s certs/key.pem ] || [ ! -s certs/cert.pem ]; then
	mkdir -p certs
	openssl req -x509 -newkey rsa:4096 -sha256 -days 365 -nodes \
		-keyout certs/key.pem -out certs/cert.pem \
		-subj "/CN=transcendence" \
		-addext "subjectAltName=DNS:localhost,IP:127.0.0.1,DNS:*.42lyon.fr"
else
	echo "Certificates already exists"
	exit 1
fi
