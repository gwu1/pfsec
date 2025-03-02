#!/bin/bash

# Endpoint URL
URL="http://localhost:8080/test/v1.0/org/b613f220-b31d-461f-ab42-3b974283ab76/sample?page=1"

# Make the GET request and store the response
RESPONSE=$(curl --silent --location --request GET "$URL")

# Extract and count the number of items in the "data" array using jq
ITEM_COUNT=$(echo "$RESPONSE" | jq '.data | length')

# Print the count
echo "Number of data items in this page: $ITEM_COUNT"