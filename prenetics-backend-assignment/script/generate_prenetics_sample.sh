#!/bin/bash

# Organisation: Prenetics

# Base URL and headers for the curl request
URL="http://localhost:8080/test/v1.0/org/b613f220-b31d-461f-ab42-3b974283ab76/profile/f46a5776-142b-4c6c-8a85-fabcb5f9e2ed/sample"
HEADER="Content-Type: application/json"

# Initial sampleId value
BASE_SAMPLE_ID=72345678

# Loop to execute the curl command 30 times
for ((i=0; i<30; i++)); do
  # Calculate the current sampleId
  CURRENT_SAMPLE_ID=$((BASE_SAMPLE_ID + i))

  # JSON payload with the incremented sampleId
  JSON_PAYLOAD=$(cat <<EOF
{
    "data": {
        "type": "sample",
        "attributes": {
            "sampleId": "$CURRENT_SAMPLE_ID",
            "resultType": "rt-pcr",
            "result": "negative"
        }
    }
}
EOF
)

  # Execute the curl command
  curl --location --request POST "$URL" \
    --header "$HEADER" \
    --data-raw "$JSON_PAYLOAD"
done